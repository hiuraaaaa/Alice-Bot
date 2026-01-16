const aliceHandler = async (msg, { sock, reply, text, command, from }) => {
    if (!text) {
        return reply(`❗ Masukkan judul lagu\nContoh: ${global.prefix}${command} shape of you`);
    }

    try {
        await reply(global.mess.wait);

        const url = `https://api.ootaizumi.web.id/downloader/spotifyplay?query=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.status || !data.result) {
            await reply("❌ Lagu tidak ditemukan. Coba judul lain!");
            return false;
        }

        const r = data.result;

        const caption = `🎵 *SPOTIFY DOWNLOADER*\n\n` +
            `📑 *Judul:* ${r.title}\n` +
            `👤 *Artis:* ${r.artists}\n` +
            `💿 *Album:* ${r.album}\n` +
            `📅 *Rilis:* ${r.release_date}\n\n` +
            `⏳ Mengirim audio...`;

        await sock.sendMessage(from, {
            image: { url: r.image },
            caption
        }, { quoted: msg });

        if (!r.download) {
            await reply("❌ Link download tidak tersedia.");
            return false;
        }

        await sock.sendMessage(from, {
            audio: { url: r.download },
            mimetype: "audio/mpeg",
            fileName: `${r.title}.mp3`
        }, { quoted: msg });

        return true;
    } catch (err) {
        console.error(err);
        await reply("❌ Terjadi kesalahan saat mengunduh lagu.");
        return false;
    }
};

aliceHandler.help = ["spotify", "play", "spdl"];
aliceHandler.tags = ["downloader"];
aliceHandler.command = /^(spotify|play|spdl)$/i;
aliceHandler.limit = 2;
aliceHandler.cooldown = 10000;

export default aliceHandler;
