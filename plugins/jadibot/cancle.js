import { jadibotSessions } from './jadibot.js';
import { deleteSession, getConnection, removeConnection } from '../../jadibot/connections.js';

const cancelJadibotHandler = async (m, { sender, reply }) => {
    const userId = sender.split('@')[0];

    try {
        // Check if ada session yang sedang berjalan
        const sock = jadibotSessions.get(userId);
        const connection = getConnection(userId);

        // Jika tidak ada session sama sekali
        if (!sock && !connection) {
            return await reply(
                `❌ *TIDAK ADA PROSES AKTIF*\n\n` +
                `Tidak ada proses jadibot yang sedang berjalan.\n\n` +
                `*Status:*\n` +
                `• Session: Tidak ada\n` +
                `• Connection: Tidak terhubung\n\n` +
                `Gunakan \`jadibot\` untuk memulai sesi baru.`
            );
        }

        // Jika sudah connected (gunakan stopjadibot instead)
        if (connection) {
            return await reply(
                `⚠️ *JADIBOT SUDAH CONNECTED*\n\n` +
                `Bot kamu sudah terhubung dan aktif.\n\n` +
                `*Info:*\n` +
                `📱 Nomor: ${connection.number}\n` +
                `👤 Nama: ${connection.name}\n` +
                `⏰ Connected: ${new Date(connection.connectedAt).toLocaleString('id-ID')}\n\n` +
                `Gunakan \`stopjadibot\` untuk disconnect.`
            );
        }

        // Jika ada session tapi belum connected (proses QR)
        if (sock) {
            console.log(`[JADIBOT] Cancelling session for ${userId}`);

            // Force end socket
            try {
                await sock.end();
                console.log(`[JADIBOT] Socket ended: ${userId}`);
            } catch (e) {
                console.log(`[JADIBOT] End error (ignored): ${e.message}`);
            }

            // Cleanup semua tracker
            jadibotSessions.delete(userId);
            deleteSession(userId);

            // Clear connection jika ada
            if (connection) {
                removeConnection(userId);
            }

            await reply(
                `✅ *PROSES DIBATALKAN!*\n\n` +
                `Proses jadibot telah dibatalkan.\n` +
                `Semua data sesi telah dihapus.\n\n` +
                `*Yang dibersihkan:*\n` +
                `• Socket connection\n` +
                `• Session files\n` +
                `• QR tracker\n` +
                `• Reconnect attempts\n\n` +
                `Gunakan \`jadibot\` untuk memulai ulang.`
            );

            console.log(`[JADIBOT] ✅ Cancelled by user: ${userId}`);
            return;
        }

    } catch (err) {
        console.error('[JADIBOT] Cancel error:', err);
        
        // Cleanup paksa jika error
        try {
            jadibotSessions.delete(userId);
            deleteSession(userId);
            removeConnection(userId);
        } catch (e) {
            console.error('[JADIBOT] Cleanup error:', e);
        }
        
        await reply(
            `⚠️ *Proses dibatalkan dengan paksa*\n\n` +
            `Ada error saat membatalkan, tapi sesi sudah dibersihkan.\n\n` +
            `Error: ${err.message}\n\n` +
            `Gunakan \`jadibot\` untuk coba lagi.`
        );
    }
};

cancelJadibotHandler.help = ['canceljadibot', 'cancelbot', 'bataljadibot'];
cancelJadibotHandler.tags = ['jadibot'];
cancelJadibotHandler.command = /^(cancel(jadibot|bot)|batal(jadibot|bot)?)$/i;
cancelJadibotHandler.limit = false;

export default cancelJadibotHandler;