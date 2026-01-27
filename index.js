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
import logger from './lib/logger.js';

// ✅ ONLY import loadPremiumUsers for loading data to global
import { loadPremiumUsers } from './lib/premiumUtils.js';

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

/**
 * Decode WhatsApp JID
 */
const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
    }
    return jid;
};

/**
 * Load all plugins from plugins directory
 */
async function loadPlugins(isReload = false) {
    const pluginsDir = path.join(__dirname, 'plugins');
    
    if (!fs.existsSync(pluginsDir)) {
        logger.warn('Plugins directory not found!');
        return { loaded: 0, failed: 0 };
    }

    const folders = fs.readdirSync(pluginsDir)
        .filter(f => fs.lstatSync(path.join(pluginsDir, f)).isDirectory());

    global.plugins = {};
    let loadedCount = 0;
    let failedCount = 0;

    for (const folder of folders) {
        const folderPath = path.join(pluginsDir, folder);
        const files = fs.readdirSync(folderPath)
            .filter(f => f.endsWith('.js'));

        for (const file of files) {
            const filePath = path.join(folderPath, file);
            
            try {
                // Cache busting for hot reload
                const moduleUrl = pathToFileURL(filePath).href + '?update=' + Date.now();
                const module = await import(moduleUrl);
                
                if (!module.default) {
                    logger.warn(`Plugin ${file} has no default export`);
                    failedCount++;
                    continue;
                }
                
                global.plugins[file] = module.default;
                
                if (!isReload) {
                    logger.plugin(folder, file);
                }
                
                loadedCount++;
                
            } catch (e) {
                logger.error(`Failed to load plugin ${file}:`, e.message);
                failedCount++;
            }
        }
    }

    const summary = isReload 
        ? `Reload: ${loadedCount} loaded, ${failedCount} failed`
        : `Loaded: ${loadedCount} plugins, ${failedCount} failed`;
    
    logger.success(summary);
    
    return { loaded: loadedCount, failed: failedCount };
}

/**
 * Send notification to all owners
 */
async function notifyOwners(sock, message) {
    if (!global.owner || global.owner.length === 0) return;

    const botNumber = sock.user?.id?.split(':')[0] || 'Unknown';
    const time = new Date().toLocaleString('id-ID');

    const notificationMessage = 
        `🤖 *BOT NOTIFICATION*\n\n` +
        `Bot: *${global.botName || 'WhatsApp Bot'}*\n` +
        `Number: ${botNumber}\n` +
        `Time: ${time}\n\n` +
        message;

    for (const ownerJid of global.owner) {
        const formattedJid = ownerJid.replace(/\D/g, '') + '@s.whatsapp.net';
        
        try {
            await sock.sendMessage(formattedJid, { text: notificationMessage });
            logger.success(`✅ Notification sent to: ${ownerJid}`);
        } catch (e) {
            logger.error(`❌ Failed to notify: ${ownerJid}`, e.message);
        }
    }
}

/**
 * Request pairing code with retry mechanism
 */
async function requestPairingCode(sock, phoneNumber, retryCount = 0) {
    try {
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        logger.info(`Requesting Pairing Code for ${phoneNumber}... (Attempt ${retryCount + 1})`);
        
        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        
        logger.pairing(code);
        return true;
        
    } catch (error) {
        logger.error('Failed to request Pairing Code:', error.message);
        
        if (retryCount < 3) {
            logger.warn('Retrying in 7 seconds...');
            await new Promise(resolve => setTimeout(resolve, 7000));
            return requestPairingCode(sock, phoneNumber, retryCount + 1);
        }
        
        return false;
    }
}

/**
 * Handle pairing process
 */
async function handlePairing(sock) {
    let phoneNumber = '';
    
    if (global.botNumber && global.botNumber.length > 5) {
        phoneNumber = global.botNumber.replace(/\D/g, '');
        logger.info(`Using bot number from settings: ${phoneNumber}`);
    } else {
        phoneNumber = await question('Enter WhatsApp bot number (e.g., 628123456789): ');
        phoneNumber = phoneNumber.replace(/\D/g, '');
    }

    if (!phoneNumber || phoneNumber.length < 10) {
        logger.error('Invalid phone number!');
        process.exit(1);
    }

    const success = await requestPairingCode(sock, phoneNumber);
    
    if (!success) {
        logger.error('Failed to get pairing code after multiple attempts');
        process.exit(1);
    }
}

/**
 * Process incoming message
 */
async function processMessage(msg, sock) {
    try {
        if (!msg?.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const messageContent = extractMessageContent(msg.message);
        const type = getContentType(messageContent);

        // Extract body text
        let body = '';
        
        switch (type) {
            case 'conversation':
                body = messageContent.conversation;
                break;
            case 'extendedTextMessage':
                body = messageContent.extendedTextMessage?.text;
                break;
            case 'imageMessage':
                body = messageContent.imageMessage?.caption;
                break;
            case 'videoMessage':
                body = messageContent.videoMessage?.caption;
                break;
            default:
                body = messageContent?.text || '';
        }

        if (!body || typeof body !== 'string') return;

        // Parse command
        const prefix = global.prefix || '.';
        const isCmd = body.startsWith(prefix);
        const commandText = isCmd 
            ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() 
            : '';
        
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(' ');
        const sender = decodeJid(msg.key.participant || msg.key.remoteJid);

        // Log message
        logger.message(msg, from, sender, body, isCmd, commandText);

        // ✅ Handler akan check premium sendiri dari global.premium
        // Tidak perlu pass isPremium dari sini
        await handler({ 
            msg, 
            sock, 
            body, 
            from, 
            args, 
            text, 
            commandText, 
            isCmd, 
            sender
        });

    } catch (err) {
        logger.error('Error processing message:', err);
    }
}

/**
 * Setup plugin hot reload watcher
 */
function setupPluginWatcher() {
    const pluginsPath = path.join(__dirname, 'plugins');
    
    if (!fs.existsSync(pluginsPath)) {
        logger.warn('Plugins directory not found for watcher');
        return;
    }

    let reloadTimeout;
    
    fs.watch(pluginsPath, { recursive: true }, async (eventType, filename) => {
        if (!filename?.endsWith('.js')) return;
        
        // Debounce reload
        clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(async () => {
            logger.info(`📝 Change detected: ${filename}. Reloading plugins...`);
            await loadPlugins(true);
        }, 1000);
    });
    
    logger.info('🔄 Plugin hot reload watcher activated');
}

// ================================
// MAIN BOT FUNCTION
// ================================

async function startBot() {
    try {
        // Setup authentication
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        const { version } = await fetchLatestBaileysVersion();
        
        // ✅ Load premium users to global.premium
        logger.info('👑 Loading premium system...');
        try {
            await loadPremiumUsers();
            logger.success(`✅ Premium loaded: ${global.premium?.length || 0} users`);
        } catch (e) {
            logger.error('❌ Failed to load premium:', e.message);
            global.premium = [];
        }
        
        // Load plugins
        logger.info('🔌 Loading plugins...');
        await loadPlugins();

        // Create socket
        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
            },
            browser: Browsers.ubuntu('Chrome'),
            getMessage: async (key) => {
                return { conversation: 'Message not available' };
            }
        });

        // Handle pairing if needed
        if (!sock.authState.creds.registered) {
            await handlePairing(sock);
        }

        // ================================
        // EVENT HANDLERS
        // ================================

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                
                if (reason === DisconnectReason.loggedOut) {
                    logger.error('🚪 Session logged out. Delete auth_info and restart.');
                    process.exit(0);
                } else {
                    reconnectAttempts++;
                    
                    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
                        logger.warn(`⚠️  Connection closed. Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                        setTimeout(() => startBot(), 5000);
                    } else {
                        logger.error('❌ Max reconnect attempts reached. Please restart manually.');
                        process.exit(1);
                    }
                }
            } else if (connection === 'open') {
                reconnectAttempts = 0;
                
                logger.asciiArt();
                logger.success('✅ Bot successfully connected!');
                logger.info(`👑 Premium Users: ${global.premium?.length || 0}`);
                logger.info(`🌍 Public Mode: ${global.isPublic ? 'ON' : 'OFF'}`);
                logger.info(`🔌 Plugins: ${Object.keys(global.plugins).length}`);
                
                const statusMessage = 
                    `✅ *BOT CONNECTED*\n\n` +
                    `Mode: ${global.isPublic ? 'Public 🌍' : 'Self 🔒'}\n` +
                    `Premium: ${global.premium?.length || 0} users 👑\n` +
                    `Plugins: ${Object.keys(global.plugins).length}\n\n` +
                    `Status: Operational`;
                
                await notifyOwners(sock, statusMessage);
                setupErrorHandler(sock);
                setupPluginWatcher();
            }
        });

        sock.ev.on('messages.upsert', async (m) => {
            const msg = m.messages[0];
            await processMessage(msg, sock);
        });

    } catch (error) {
        logger.error('❌ Critical error in startBot:', error);
        process.exit(1);
    }
}

// ================================
// GRACEFUL SHUTDOWN
// ================================

async function gracefulShutdown(signal) {
    logger.warn(`\n⚠️  Received ${signal}. Shutting down gracefully...`);
    rl.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.success('👋 Bot stopped successfully');
    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
    logger.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error('❌ Unhandled Rejection:', err);
});

// ================================
// START BOT
// ================================

logger.info('🚀 Starting bot...');
startBot(); 
