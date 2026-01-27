const aliceHandler = async (m, { sock, reply, text, isOwner }) => {
    if (!isOwner) return reply(global.mess.owner);

    if (!text) {
        return reply(
            `❗ Masukkan pesan broadcast\n\n` +
            `Contoh: ${global.prefix}broadcast Halo semua!`
        );
    }

    await reply('📡 Memulai broadcast...');

    try {
        const chats = await sock.groupFetchAllParticipating();
        const groups = Object.values(chats).filter(chat => chat.id.endsWith('@g.us'));

        let successCount = 0;
        let failCount = 0;

        for (const group of groups) {
            try {
                await sock.sendMessage(group.id, {
                    text: `📢 *BROADCAST*\n\n${text}\n\n_Pesan ini dikirim oleh owner bot_`
                });
                successCount++;
                await new Promise(r => setTimeout(r, 2000)); // Delay 2 detik
            } catch (err) {
                failCount++;
                console.error(`Failed to broadcast to ${group.id}:`, err);
            }
        }

        await reply(
            `✅ *Broadcast selesai!*\n\n` +
            `📊 Total grup: ${groups.length}\n` +
            `✅ Berhasil: ${successCount}\n` +
            `❌ Gagal: ${failCount}`
        );

        return true;
    } catch (err) {
        console.error(err);
        await reply('❌ Terjadi kesalahan saat broadcast.');
        return false;
    }
};

aliceHandler.help = ["broadcast", "bc"];
aliceHandler.tags = ["owner"];
aliceHandler.command = /^(broadcast|bc)$/i;
aliceHandler.owner = true;
aliceHandler.limit = false;

export default aliceHandler;