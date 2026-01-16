const aliceHandler = async (msg, { sock, reply, text, command, from }) => {
    if (!text) {
        return reply(`❗ Masukkan judul lagu\nContoh: ${global.prefix}${command} 2002 Anne-Marie`);
    }

    try {
        await reply(global.mess.wait);

        const url = `https://api.nekolabs.web.id/downloader/youtube/play/v1?q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.success || !data.result) {
            await reply("❌ Lagu tidak ditemukan. Coba judul lain!");
            return false;
        }

        const r = data.result;
        const meta = r.metadata;

        const caption = `🎵 *MUSIK DOWNLOADER*\n\n` +
            `📑 *Judul:* ${meta.title}\n` +
            `👤 *Channel:* ${meta.channel}\n` +
            `⏱ *Durasi:* ${meta.duration}\n\n` +
            `⏳ Mengirim audio...`;

        await sock.sendMessage(from, {
            image: { url: meta.cover },
            caption
        }, { quoted: msg });

        if (!r.downloadUrl) {
            await reply("❌ Link download tidak tersedia.");
            return false;
        }

        await sock.sendMessage(from, {
            audio: { url: r.downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${meta.title}.mp3`
        }, { quoted: msg });

        return true;
    } catch (err) {
        console.error(err);
        await reply("❌ Terjadi kesalahan saat mengunduh musik.");
        return false;
    }
};

aliceHandler.help = ["ytplay", "music"];
aliceHandler.tags = ["downloader"];
aliceHandler.command = /^(ytplay|music)$/i;
aliceHandler.limit = 2;
aliceHandler.cooldown = 10000;

export default aliceHandler;
