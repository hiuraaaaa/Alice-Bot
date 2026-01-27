import { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    makeCacheableSignalKeyStore,
    Browsers,
    fetchLatestBaileysVersion
} from 'baileys';
import pino from 'pino';
import NodeCache from 'node-cache';
import qrcode from 'qrcode';
import { 
    addConnection, 
    removeConnection, 
    getSessionPath, 
    isConnected,
    getConnectionCount,
    deleteSession
} from '../../jadibot/connections.js';
import handler from '../../handler.js';

const jadibotSessions = new Map();
const msgRetryCounterCache = new NodeCache();
const qrTracker = new Map();
const reconnectAttempts = new Map();

// ✅ Helper: Send notification to all owners
async function notifyOwners(mainSock, message) {
    if (!global.owner || global.owner.length === 0) return;
    
    for (const ownerJid of global.owner) {
        const formattedOwnerJid = ownerJid.replace(/\D/g, "") + "@s.whatsapp.net";
        try {
            await mainSock.sendMessage(formattedOwnerJid, { text: message });
            console.log(`[JADIBOT] Notification sent to owner: ${ownerJid}`);
        } catch (e) {
            console.error(`[JADIBOT] Failed to notify owner ${ownerJid}:`, e.message);
        }
    }
}

async function startJadibot(userId, mainSock, from, isReconnect = false) {
    try {
        if (isReconnect) {
            const attempts = reconnectAttempts.get(userId) || 0;
            if (attempts >= 3) {
                reconnectAttempts.delete(userId);
                jadibotSessions.delete(userId);
                qrTracker.delete(userId);
                deleteSession(userId);
                
                await mainSock.sendMessage(from, {
                    text: 
                        `❌ *JADIBOT GAGAL*\n\n` +
                        `Terlalu banyak percobaan reconnect.\n\n` +
                        `Kemungkinan:\n` +
                        `• Session expired\n` +
                        `• Nomor logout dari WhatsApp\n` +
                        `• Koneksi tidak stabil\n\n` +
                        `Gunakan \`jadibot\` untuk mulai dari awal.`
                });
                return;
            }
            reconnectAttempts.set(userId, attempts + 1);
        } else {
            reconnectAttempts.delete(userId);
        }

        if (isConnected(userId) && !isReconnect) {
            await mainSock.sendMessage(from, { 
                text: '❌ Kamu sudah terhubung sebagai bot!\n\nGunakan `stopjadibot` untuk disconnect.' 
            });
            return;
        }

        const currentConnections = getConnectionCount();
        if (currentConnections >= 5 && !isReconnect) {
            await mainSock.sendMessage(from, { 
                text: '❌ Maksimal 5 jadibot aktif!\n\nTunggu slot tersedia atau hubungi owner.' 
            });
            return;
        }

        const sessionPath = getSessionPath(userId);
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const isRegistered = state.creds?.registered;
        console.log(`[JADIBOT] ${userId} - Registered: ${isRegistered}`);

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: Browsers.ubuntu('Chrome'),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
            },
            msgRetryCounterCache,
            generateHighQualityLinkPreview: true,
            getMessage: async (key) => {
                return { conversation: 'Jadibot Session' };
            }
        });

        jadibotSessions.set(userId, sock);

        if (!isRegistered && !qrTracker.has(userId)) {
            qrTracker.set(userId, {
                count: 0,
                lastSent: 0,
                maxQR: 3
            });
        }

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // ✅ Handle QR
            if (qr && !isRegistered) {
                const tracker = qrTracker.get(userId);
                if (!tracker) return;

                const now = Date.now();
                
                if (tracker.count >= tracker.maxQR) {
                    jadibotSessions.delete(userId);
                    qrTracker.delete(userId);
                    reconnectAttempts.delete(userId);
                    deleteSession(userId);
                    
                    await mainSock.sendMessage(from, {
                        text: 
                            `⚠️ *JADIBOT TIMEOUT*\n\n` +
                            `QR code expired ${tracker.maxQR} kali.\n\n` +
                            `Gunakan \`jadibot\` untuk coba lagi.`
                    });
                    
                    try { await sock.end(); } catch (e) {}
                    return;
                }

                if (now - tracker.lastSent < 15000) return;

                try {
                    const qrImage = await qrcode.toDataURL(qr);
                    const qrBuffer = Buffer.from(qrImage.split(',')[1], 'base64');

                    await mainSock.sendMessage(from, {
                        image: qrBuffer,
                        caption: 
                            `*🤖 JADIBOT - SCAN QR* (${tracker.count + 1}/${tracker.maxQR})\n\n` +
                            `Scan QR dengan WhatsApp kamu:\n\n` +
                            `1. Buka WhatsApp di HP\n` +
                            `2. Menu (⋮) > Linked Devices\n` +
                            `3. Link a Device\n` +
                            `4. Scan QR di atas\n\n` +
                            `⏳ Expired: 60 detik\n` +
                            `⚠️ Sisa: ${tracker.maxQR - tracker.count - 1}\n\n` +
                            `_Scan cepat!_`
                    });

                    tracker.count++;
                    tracker.lastSent = now;
                    qrTracker.set(userId, tracker);

                } catch (err) {
                    console.error('[JADIBOT] QR error:', err);
                }
            }

            // ✅ Connected
            if (connection === 'open') {
                const user = sock.user;
                qrTracker.delete(userId);
                reconnectAttempts.delete(userId);
                
                addConnection(userId, {
                    jid: user.id,
                    name: user.name || 'Unknown',
                    number: user.id.split(':')[0]
                });

                // ✅ Kirim notif ke user
                await mainSock.sendMessage(from, {
                    text: 
                        `✅ *JADIBOT BERHASIL!*\n\n` +
                        `📱 Nomor: ${user.id.split(':')[0]}\n` +
                        `👤 Nama: ${user.name || 'Unknown'}\n` +
                        `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
                        `🤖 Bot aktif!\n\n` +
                        `*Test:*\n` +
                        `.ping - Test response\n\n` +
                        `*Manage:*\n` +
                        `stopjadibot - Disconnect\n\n` +
                        `_Jangan logout!_`
                });

                // ✅ Kirim notif ke SEMUA OWNER
                const ownerNotif = 
                    `🤖 *JADIBOT CONNECTED*\n\n` +
                    `📱 Nomor: ${user.id.split(':')[0]}\n` +
                    `👤 Nama: ${user.name || 'Unknown'}\n` +
                    `🆔 JID: ${user.id}\n` +
                    `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n` +
                    `📊 Total Jadibot: ${getConnectionCount()}/5\n\n` +
                    `_Jadibot baru telah terhubung_`;
                
                await notifyOwners(mainSock, ownerNotif);

                console.log(`[JADIBOT] ✅ Connected: ${user.id}`);
            }

            // ✅ Disconnected - FIXED
            if (connection === 'close') {
                const error = lastDisconnect?.error;
                const statusCode = error?.output?.statusCode;
                const reason = error?.message || error?.toString() || 'Connection closed';
                
                console.log(`[JADIBOT] Closed - Code: ${statusCode || 'N/A'}, Reason: ${reason}`);

                // ✅ Force close (dari timeout/cancel) - Jangan kirim error message
                if (!lastDisconnect || !statusCode) {
                    console.log(`[JADIBOT] Force closed for ${userId}`);
                    removeConnection(userId);
                    jadibotSessions.delete(userId);
                    qrTracker.delete(userId);
                    reconnectAttempts.delete(userId);
                    return; // ✅ Exit tanpa kirim message
                }

                // ✅ Logout manual
                if (statusCode === DisconnectReason.loggedOut) {
                    removeConnection(userId);
                    jadibotSessions.delete(userId);
                    qrTracker.delete(userId);
                    reconnectAttempts.delete(userId);
                    deleteSession(userId);
                    
                    await mainSock.sendMessage(from, {
                        text: 
                            `⚠️ *JADIBOT DISCONNECTED*\n\n` +
                            `Bot telah logout.\n\n` +
                            `Gunakan \`jadibot\` untuk connect lagi.`
                    });

                    // ✅ Notif owner
                    await notifyOwners(mainSock, 
                        `⚠️ *JADIBOT DISCONNECTED*\n\n` +
                        `User: ${userId}\n` +
                        `Reason: Manual logout\n` +
                        `Time: ${new Date().toLocaleString('id-ID')}`
                    );
                    
                    return;
                }

                // ✅ Reconnect untuk error lain
                const shouldReconnect = [
                    DisconnectReason.connectionClosed,
                    DisconnectReason.connectionLost,
                    DisconnectReason.connectionReplaced,
                    DisconnectReason.timedOut,
                    DisconnectReason.restartRequired
                ].includes(statusCode);

                if (shouldReconnect) {
                    const attempts = reconnectAttempts.get(userId) || 0;
                    console.log(`[JADIBOT] Reconnecting... (${attempts + 1}/3)`);
                    
                    setTimeout(() => {
                        startJadibot(userId, mainSock, from, true);
                    }, 5000);
                } else {
                    // ✅ Error lain - cleanup
                    removeConnection(userId);
                    jadibotSessions.delete(userId);
                    qrTracker.delete(userId);
                    reconnectAttempts.delete(userId);
                    
                    // ✅ Hanya kirim message kalau ada statusCode yang jelas
                    if (statusCode) {
                        await mainSock.sendMessage(from, {
                            text: 
                                `❌ *JADIBOT ERROR*\n\n` +
                                `Reason: ${reason}\n` +
                                `Code: ${statusCode}\n\n` +
                                `Gunakan \`jadibot\` untuk coba lagi.`
                        });
                    }
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                if (!msg?.message || msg.key.fromMe) return;

                const from = msg.key.remoteJid;
                const messageContent = msg.message;
                
                let body = '';
                if (messageContent.conversation) {
                    body = messageContent.conversation;
                } else if (messageContent.extendedTextMessage) {
                    body = messageContent.extendedTextMessage?.text || '';
                } else if (messageContent.imageMessage) {
                    body = messageContent.imageMessage?.caption || '';
                } else if (messageContent.videoMessage) {
                    body = messageContent.videoMessage?.caption || '';
                }

                if (!body) return;

                const prefix = global.prefix || '.';
                const isCmd = body.startsWith(prefix);
                const commandText = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
                const args = body.trim().split(/ +/).slice(1);
                const text = args.join(' ');
                const sender = msg.key.participant || msg.key.remoteJid;

                console.log(`[JADIBOT ${userId}] 📩 ${commandText || 'msg'} from ${sender.split('@')[0]}`);

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
                console.error(`[JADIBOT ${userId}] Message error:`, err);
            }
        });

        if (!isReconnect) {
            await mainSock.sendMessage(from, { 
                text: 
                    `⏳ *MEMULAI JADIBOT...*\n\n` +
                    `Tunggu QR code...\n\n` +
                    `_Pastikan nomor belum logout_` 
            });
        }

    } catch (err) {
        console.error('[JADIBOT] Start error:', err);
        qrTracker.delete(userId);
        reconnectAttempts.delete(userId);
        jadibotSessions.delete(userId);
        
        await mainSock.sendMessage(from, { 
            text: `❌ Error: ${err.message}\n\nCoba lagi atau hubungi owner.` 
        });
    }
}

const jadibotHandler = async (m, { sock, sender, from, reply }) => {
    const userId = sender.split('@')[0];
    await reply('⏳ Memulai jadibot...');
    await startJadibot(userId, sock, from, false);
};

jadibotHandler.help = ['jadibot'];
jadibotHandler.tags = ['jadibot'];
jadibotHandler.command = /^(jadibot)$/i;
jadibotHandler.limit = 5;
jadibotHandler.premium = false;

export default jadibotHandler;
export { jadibotSessions, qrTracker, reconnectAttempts };