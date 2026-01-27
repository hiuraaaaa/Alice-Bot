import { getAllConnections } from '../../jadibot/connections.js';

const listJadibotHandler = async (m, { reply }) => {
    try {
        const connections = getAllConnections();
        const entries = Object.entries(connections);

        if (entries.length === 0) {
            return await reply(
                `📊 *JADIBOT STATUS*\n\n` +
                `Tidak ada jadibot yang aktif saat ini.\n\n` +
                `Gunakan \`jadibot\` untuk memulai sesi.`
            );
        }

        let text = `*🤖 JADIBOT AKTIF* (${entries.length}/5)\n\n`;

        entries.forEach(([userId, data], i) => {
            const connectedTime = new Date(data.connectedAt).toLocaleString('id-ID');
            const lastSeenTime = new Date(data.lastSeen).toLocaleString('id-ID');
            const duration = Math.floor((Date.now() - data.connectedAt) / 1000 / 60); // minutes

            text += `*${i + 1}. ${data.name}*\n`;
            text += `├ 📱 Nomor: ${data.number}\n`;
            text += `├ 🔗 JID: ${data.jid.substring(0, 20)}...\n`;
            text += `├ ⏰ Connected: ${connectedTime}\n`;
            text += `├ 👁️ Last Seen: ${lastSeenTime}\n`;
            text += `└ ⌛ Duration: ${duration} menit\n\n`;
        });

        text += `_Total: ${entries.length} jadibot aktif_\n\n`;
        text += `*Commands:*\n`;
        text += `• stopjadibot - Stop sesi kamu\n`;
        text += `• canceljadibot - Cancel proses jadibot`;

        await reply(text);

    } catch (err) {
        console.error('[JADIBOT] List error:', err);
        await reply(
            `❌ *Error mengambil list jadibot*\n\n` +
            `${err.message}\n\n` +
            `Coba lagi nanti.`
        );
    }
};

listJadibotHandler.help = ['listjadibot', 'listbot'];
listJadibotHandler.tags = ['jadibot'];
listJadibotHandler.command = /^(listjadibot|listbot|jadibot\s?list)$/i;
listJadibotHandler.limit = false;

export default listJadibotHandler;