const aliceHandler = async (m, { sock, reply }) => {
    const from = m.key.remoteJid;
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!mentioned || mentioned.length === 0) {
        return reply(
            `❗ Tag user yang ingin di-kick\n\n` +
            `Contoh: ${global.prefix}kick @user @user2`
        );
    }

    try {
        await sock.groupParticipantsUpdate(from, mentioned, 'remove');
        
        await reply(
            `✅ *Berhasil kick!*\n\n` +
            `👥 Total: ${mentioned.length} user\n` +
            mentioned.map(u => `• @${u.split('@')[0]}`).join('\n'),
            { mentions: mentioned }
        );

        return true;
    } catch (err) {
        console.error(err);
        await reply('❌ Gagal kick user. Pastikan bot adalah admin!');
        return false;
    }
};

aliceHandler.help = ["kick"];
aliceHandler.tags = ["group"];
aliceHandler.command = /^(kick|tendang)$/i;
aliceHandler.group = true;
aliceHandler.admin = true;
aliceHandler.botAdmin = true;
aliceHandler.limit = false;

export default aliceHandler;