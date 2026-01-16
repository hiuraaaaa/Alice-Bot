const aliceHandler = async (m, { sock, reply }) => {
    try {
        if (!global.plugins) {
            return reply("❌ Tidak ada plugin yang dimuat.");
        }

        const total = Object.keys(global.plugins).length;
        const pluginList = Object.keys(global.plugins)
            .map((p, i) => `${i + 1}. ${p}`)
            .join('\n');

        const caption = `✅ *Total Fitur Aktif:* ${total}\n\n` +
            `📌 *Daftar Fitur:*\n${pluginList}`;

        await reply(caption);

        return true;
    } catch (err) {
        console.error(err);
        await reply("❌ Terjadi kesalahan saat menghitung fitur.");
        return false;
    }
};

aliceHandler.help = ["totalfitur", "features"];
aliceHandler.tags = ["info"];
aliceHandler.command = /^(totalfitur|features)$/i;
aliceHandler.limit = false;

export default aliceHandler;
