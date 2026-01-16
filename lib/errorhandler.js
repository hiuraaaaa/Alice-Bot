import { Boom } from '@hapi/boom';

// Fungsi untuk mengirim pesan error ke owner
async function sendError(sock, error, type = 'Error') {
    if (!global.owner || global.owner.length === 0) return;

    const errorMessage = `*${type} Terdeteksi!*\n\n` +
                         `*Bot:* ${global.botName} (${global.botNumber})\n` +
                         `*Pesan:* ${error.message || error}\n` +
                         `*Stack:*\n${error.stack || 'Tidak ada stack trace'}`;

    for (const ownerJid of global.owner) {
        const ownerNumber = ownerJid.replace(/\D/g, "");
        const formattedOwnerJid = ownerNumber + "@s.whatsapp.net";
        try {
            await sock.sendMessage(formattedOwnerJid, { text: errorMessage });
            console.log(`[ERROR HANDLER] Pesan error berhasil dikirim ke owner ${ownerNumber}`);
        } catch (e) {
            console.error(`[ERROR HANDLER] Gagal mengirim pesan error ke owner ${ownerNumber}:`, e);
        }
    }
}

// Fungsi untuk setup global error handler
function setupErrorHandler(sock) {
    process.on('uncaughtException', async (err, origin) => {
        console.error('[UNCAUGHT EXCEPTION]', err, origin);
        await sendError(sock, err, 'Uncaught Exception');
    });

    process.on('unhandledRejection', async (reason, promise) => {
        console.error('[UNHANDLED REJECTION]', reason, promise);
        await sendError(sock, reason, 'Unhandled Rejection');
    });

    console.log('[ERROR HANDLER] Global error handlers telah diatur.');
}

export { sendError, setupErrorHandler };
 
