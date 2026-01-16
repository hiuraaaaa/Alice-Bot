/**
 * Spotify Downloader Plugin
 * Versi fetch (Native Node.js 20+)
 */

const handler = async (msg, { sock, reply, text, command, from }) => {

    if (!text) return reply(`Mau download apa? Contoh: *${command} shape of you*`);

    try {
        await reply("_Sabar, gue cari lagunya dulu..._");

        const url = `https://api.ootaizumi.web.id/downloader/spotifyplay?query=${encodeURIComponent(text)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.status || !data.result) {
            reply("Lagu nggak ketemu. Coba judul lain, jangan typo!");
            return false;
        }

        const r = data.result;

        const caption = `
🎵 *SPOTIFY DOWNLOADER* 🎵

📑 *Judul:* ${r.title}
👤 *Artis:* ${r.artists}
💿 *Album:* ${r.album}
📅 *Rilis:* ${r.release_date}
🔗 *URL:* ${r.external_url}

_Sabar ya, audionya gue kirimin..._
        `.trim();

        // Kirim cover + detail lagu
        await sock.sendMessage(from, {
            image: { url: r.image },
            caption
        }, { quoted: msg });

        // Cek dulu download link
        if (!r.download) {
            reply("Link download kosong. API-nya lagi error.");
            return false;
        }

        // Kirim audio
        await sock.sendMessage(from, {
            audio: { url: r.download },
            mimetype: "audio/mpeg",
            fileName: `${r.title}.mp3`
        }, { quoted: msg });

        return true; // Sukses → potong limit

    } catch (err) {
        console.error("Spotify Plugin Error:", err);
        reply("API-nya lagi error atau internet lo lemot.");
        return false; // Error → jangan potong limit
    }
};

handler.command = ['spotify', 'play', 'spdl'];
handler.limit = 2;
handler.cooldown = 10000;

export default handler;