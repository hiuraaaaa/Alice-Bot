import { removeConnection, deleteSession, getConnection } from '../../jadibot/connections.js';
import { jadibotSessions } from './jadibot.js';

const delJadibotHandler = async (m, { args, reply, isOwner }) => {
    if (!isOwner) return reply(global.mess.owner);

    try {
        // Get target from mention or args
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const targetNumber = mentioned 
            ? mentioned.split('@')[0] 
            : args[0]?.replace(/\D/g, '');

        if (!targetNumber) {
            return await reply(
                `❌ *FORMAT SALAH*\n\n` +
                `Tag user atau masukkan nomor!\n\n` +
                `*Contoh:*\n` +
                `• deljadibot @user\n` +
                `• deljadibot 628123456789\n` +
                `• deljadibot 8123456789`
            );
        }

        const connection = getConnection(targetNumber);

        if (!connection) {
            return await reply(
                `❌ *USER TIDAK DITEMUKAN*\n\n` +
                `User ${targetNumber} tidak memiliki sesi jadibot aktif.`
            );
        }

        // Force logout
        const sock = jadibotSessions.get(targetNumber);
        if (sock) {
            try {
                await sock.logout();
                console.log(`[JADIBOT] Force logout: ${targetNumber}`);
            } catch (e) {
                console.log('[JADIBOT] Logout error (ignored):', e.message);
            }
            jadibotSessions.delete(targetNumber);
        }

        // Delete session & connection
        removeConnection(targetNumber);
        deleteSession(targetNumber);

        await reply(
            `✅ *SESI DIHAPUS!*\n\n` +
            `📱 Nomor: ${connection.number}\n` +
            `👤 Nama: ${connection.name}\n` +
            `🔗 JID: ${connection.jid}\n` +
            `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
            `Sesi jadibot telah dihapus oleh owner.\n\n` +
            `_User tersebut harus connect ulang untuk menggunakan jadibot._`
        );

        console.log(`[JADIBOT] ✅ Deleted by owner: ${targetNumber}`);

    } catch (err) {
        console.error('[JADIBOT] Delete error:', err);
        await reply(
            `❌ *Error menghapus sesi*\n\n` +
            `${err.message}\n\n` +
            `Coba lagi atau restart bot.`
        );
    }
};

delJadibotHandler.help = ['deljadibot'];
delJadibotHandler.tags = ['owner'];
delJadibotHandler.command = /^(deljadibot|deletejadibot|hapusjadibot)$/i;
delJadibotHandler.owner = true;
delJadibotHandler.limit = false;

export default delJadibotHandler;