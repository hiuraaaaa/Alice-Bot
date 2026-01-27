const aliceHandler = async (m, { sock, reply, text }) => {
    const from = m.key.remoteJid;

    try {
        const metadata = await sock.groupMetadata(from);
        const participants = metadata.participants.map(p => p.id);

        const message = text || 'Tag All!';
        const mentions = participants;

        let tagText = `📢 *TAG ALL*\n\n`;
        tagText += `📝 Pesan: ${message}\n\n`;
        tagText += `👥 Total: ${participants.length} members\n\n`;
        tagText += participants.map(id => `• @${id.split('@')[0]}`).join('\n');

        await sock.sendMessage(from, {
            text: tagText,
            mentions: mentions
        }, { quoted: m });

        return true;
    } catch (err) {
        console.error(err);
        await reply('❌ Gagal tag all members.');
        return false;
    }
};

aliceHandler.help = ["tagall", "everyone"];
aliceHandler.tags = ["group"];
aliceHandler.command = /^(tagall|everyone)$/i;
aliceHandler.group = true;
aliceHandler.admin = true;
aliceHandler.limit = false;

export default aliceHandler;