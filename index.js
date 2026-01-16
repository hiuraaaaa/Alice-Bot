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

import './settings.js';
import handler from './handler.js';
import { setupErrorHandler } from './lib/errorhandler.js';
import logger from './lib/logger.js';
import { loadPremiumUsers } from './lib/premiumUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

global.plugins = {};

const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
    } else return jid;
};

async function loadPlugins(isReload = false) {
    const pluginsDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginsDir)) return;
    const folders = fs.readdirSync(pluginsDir).filter(f => fs.lstatSync(path.join(pluginsDir, f)).isDirectory());

    global.plugins = {}; 
    let loadedCount = 0;

    for (const folder of folders) {
        const files = fs.readdirSync(path.join(pluginsDir, folder)).filter(f => f.endsWith('.js'));
        for (const file of files) {
            const filePath = path.join(pluginsDir, folder, file);
            try {
                const module = await import(pathToFileURL(filePath).href + '?update=' + Date.now());
                if (!module.default) continue;
                global.plugins[file] = module.default;
                if (!isReload) {
                    logger.plugin(folder, file);
                }
                loadedCount++;
            } catch (e) {
                logger.error(`Gagal memuat plugin ${file}`, e);
            }
        }
    }

    if (isReload) {
        logger.success(`Berhasil memuat ulang ${loadedCount} plugin.`);
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();
    
    logger.info('👑 Loading premium system...');
    loadPremiumUsers();
    
    await loadPlugins();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, 
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        browser: Browsers.ubuntu('Chrome')
    });

    if (!sock.authState.creds.registered) {
        let phoneNumber = '';
        if (global.botNumber && global.botNumber.length > 5) {
            phoneNumber = global.botNumber.replace(/\D/g, '');
            logger.info(`Menggunakan nomor bot dari settings.js: ${phoneNumber}`);
        } else {
            phoneNumber = await question('Masukkan nomor WhatsApp bot Anda (contoh: 628123456789): ');
            phoneNumber = phoneNumber.replace(/\D/g, '');
        }

        if (!phoneNumber) {
            logger.error('Nomor tidak valid!');
            process.exit(1);
        }

        const requestPairing = async (retryCount = 0) => {
            try {
                await new Promise(resolve => setTimeout(resolve, 6000));
                logger.info(`Mencoba meminta Pairing Code untuk ${phoneNumber}... (Percobaan ${retryCount + 1})`);
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                logger.pairing(code);
            } catch (error) {
                logger.error("Gagal meminta Pairing Code", error);
                if (retryCount < 3) {
                    logger.warn("Mencoba lagi dalam 7 detik...");
                    await requestPairing(retryCount + 1);
                }
            }
        };

        requestPairing();
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                logger.warn("Koneksi terputus, mencoba menyambung kembali...");
                setTimeout(() => startBot(), 5000);
            } else {
                logger.warn("Sesi keluar. Hapus folder auth_info dan jalankan lagi.");
            }
        } else if (connection === 'open') {
            // ✨ TAMPILKAN ASCII ART DULU
            logger.asciiArt();
            
            logger.success("Bot WhatsApp berhasil tersambung!");
            logger.info(`Premium Users: ${global.premium.length} 👑`);
            logger.info(`Public Mode: ${global.isPublic ? 'ON 🌍' : 'OFF 🔒'}`);
            
            // Notifikasi ke owner
            if (global.owner && global.owner.length > 0) {
                const botNumber = sock.user.id.split(':')[0];
                const time = new Date().toLocaleString('id-ID');
                
                const connectionMessage = 
                    `🤖 *BOT CONNECTED*\n\n` +
                    `Bot: *${global.botName || 'WhatsApp Bot'}*\n` +
                    `Number: ${botNumber}\n` +
                    `Time: ${time}\n` +
                    `Mode: ${global.isPublic ? 'Public 🌍' : 'Self 🔒'}\n` +
                    `Premium Users: ${global.premium.length} 👑\n\n` +
                    `Status: ✅ Operasional Normal`;
                
                for (const ownerJid of global.owner) {
                    const formattedOwnerJid = ownerJid.replace(/\D/g, "") + "@s.whatsapp.net";
                    try {
                        await sock.sendMessage(formattedOwnerJid, { text: connectionMessage });
                        logger.success(`Notifikasi terkirim ke owner: ${ownerJid}`);
                    } catch (e) {
                        logger.error(`Gagal mengirim notif ke owner ${ownerJid}`, e);
                    }
                }
            }
            
            setupErrorHandler(sock);
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg?.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const messageContent = extractMessageContent(msg.message);
            const type = getContentType(messageContent);

            let body = '';
            if (type === 'conversation') body = messageContent.conversation;
            else if (type === 'extendedTextMessage') body = messageContent.extendedTextMessage?.text;
            else if (type === 'imageMessage') body = messageContent.imageMessage?.caption;
            else if (type === 'videoMessage') body = messageContent.videoMessage?.caption;
            else if (messageContent?.text) body = messageContent.text;

            if (!body) return;

            const prefix = global.prefix || '.';
            const isCmd = body.startsWith(prefix);
            const commandText = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
            const args = body.trim().split(/ +/).slice(1);
            const text = args.join(' ');
            const sender = decodeJid(msg.key.participant || msg.key.remoteJid);

            const senderId = sender.split('@')[0].replace(/\D/g, '');
            const formattedOwners = (global.owner || []).map(o => o.replace(/\D/g, ''));
            const isOwner = formattedOwners.includes(senderId);

            // ✨ LOG MESSAGE
            logger.message(msg, from, sender, body, isCmd, commandText);

            await handler({ msg, sock, body, from, args, text, commandText, isCmd, sender, isOwner });

        } catch (err) {
            logger.error("Error handling message", err);
        }
    });

    const pluginsPath = path.join(__dirname, 'plugins');
    if (fs.existsSync(pluginsPath)) {
        fs.watch(pluginsPath, { recursive: true }, async (eventType, filename) => {
            if (filename?.endsWith('.js')) {
                logger.info(`Perubahan terdeteksi pada: ${filename}. Memuat ulang plugin...`);
                await loadPlugins(true);
            }
        });
    }
}

startBot();
