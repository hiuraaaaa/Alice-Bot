import {
    makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidDecode,
    getContentType,
    extractMessageContent,
    DisconnectReason,
    Browsers
} from 'baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import readline from 'readline';

// Import configurations and handlers
import './settings.js';
import handler from './handler.js';
import { setupErrorHandler } from './lib/errorhandler.js';
import { logger } from './lib/logger.js';
import { loadPremiumUsers } from './lib/premiumUtils.js';
import { handleParticipantsUpdate } from './lib/group/eventHandler.js';
import { checkAntiLink } from './lib/group/antiLink.js';

// ================================
// SETUP
// ================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout 
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// Global state
global.plugins = {};
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// ================================
// UTILITY FUNCTIONS
// ================================

const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
    }
    return jid;
};

async function loadPlugins(isReload = false) {
    const pluginsDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsDir)) {
        logger.warn('Plugins directory not found!');
        return { loaded: 0, failed: 0 };
    }

    const readRecursive = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat && stat.isDirectory()) {
                results = results.concat(readRecursive(fullPath));
            } else if (file.endsWith('.js')) {
                results.push(fullPath);
            }
        });
        return results;
    };

    const files = readRecursive(pluginsDir);
    global.plugins = {};
    let loadedCount = 0;
    let failedCount = 0;

    for (const filePath of files) {
        const fileName = path.basename(filePath);
        const relativePath = path.relative(pluginsDir, filePath);
        
        try {
            const moduleUrl = pathToFileURL(filePath).href + '?update=' + Date.now();
            const module = await import(moduleUrl);
            
            if (!module.default) {
                logger.warn(`Plugin ${relativePath} has no default export`);
                failedCount++;
                continue;
            }
            
            global.plugins[relativePath] = module.default;
            if (!isReload) logger.plugin(path.dirname(relativePath), fileName);
            loadedCount++;
        } catch (e) {
            logger.error(`Failed to load plugin ${relativePath}:`, e.message);
            failedCount++;
        }
    }

    const summary = isReload 
        ? `Reload: ${loadedCount} loaded, ${failedCount} failed`
        : `Loaded: ${loadedCount} plugins, ${failedCount} failed`;
    logger.success(summary);
    return { loaded: loadedCount, failed: failedCount };
}

async function notifyOwners(sock, message) {
    if (!global.owner || global.owner.length === 0) return;
    const botNumber = sock.user?.id?.split(':')[0] || 'Unknown';
    const time = new Date().toLocaleString('id-ID');
    const notificationMessage = `🤖 *BOT NOTIFICATION*\n\nBot: *${global.botName}*\nNumber: ${botNumber}\nTime: ${time}\n\n${message}`;

    for (const ownerJid of global.owner) {
        const formattedJid = ownerJid.replace(/\D/g, '') + '@s.whatsapp.net';
        try {
            await sock.sendMessage(formattedJid, { text: notificationMessage });
        } catch (e) {
            logger.error(`❌ Failed to notify: ${ownerJid}`, e.message);
        }
    }
}

async function startBot() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        const { version } = await fetchLatestBaileysVersion();
        
        logger.info('👑 Loading premium system...');
        await loadPremiumUsers().catch(e => logger.error('❌ Premium load failed:', e));
        
        logger.info('🔌 Loading plugins...');
        await loadPlugins();

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
            },
            browser: Browsers.ubuntu('Chrome'),
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    process.exit(0);
                } else {
                    reconnectAttempts++;
                    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
                        setTimeout(() => startBot(), 5000);
                    } else {
                        process.exit(1);
                    }
                }
            } else if (connection === 'open') {
                reconnectAttempts = 0;
                logger.success('✅ Bot successfully connected!');
                await notifyOwners(sock, 'Bot is now online and operational.');
                setupErrorHandler(sock);
            }
        });

        sock.ev.on('group-participants.update', async (event) => {
            await handleParticipantsUpdate(sock, event);
        });

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;
            
            await checkAntiLink(sock, msg);
            
            const from = msg.key.remoteJid;
            const messageContent = extractMessageContent(msg.message);
            const type = getContentType(messageContent);
            let body = type === 'conversation' ? messageContent.conversation : 
                       type === 'extendedTextMessage' ? messageContent.extendedTextMessage?.text : 
                       type === 'imageMessage' ? messageContent.imageMessage?.caption : 
                       type === 'videoMessage' ? messageContent.videoMessage?.caption : '';

            if (!body) return;

            const prefix = global.prefix || '.';
            const isCmd = body.startsWith(prefix);
            const commandText = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const text = args.join(' ');
            const sender = decodeJid(msg.key.participant || msg.key.remoteJid);

            logger.message(msg, from, sender, body, isCmd, commandText);

            await handler({ msg, sock, body, from, args, text, commandText, isCmd, sender });
        });

    } catch (error) {
        logger.error('❌ Critical error in startBot:', error);
        process.exit(1);
    }
}

startBot();
