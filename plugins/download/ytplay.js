/**
 * Spotify / YouTube Music Downloader Plugin
 * Native fetch Node.js 20+
 */

const handler = async (msg, { sock, reply, text, command, from }) => {
  if (!text) return reply(`Mau download lagu apa? Contoh: *${command} 2002 Anne-Marie*`);

  try {
    await reply("_Sabar, gue cari lagunya dulu..._");

    // 1. Panggil API
    const url = `https://api.nekolabs.web.id/downloader/youtube/play/v1?q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success || !data.result) {
      return reply("❌ Lagu nggak ketemu. Coba judul lain, jangan typo!");
    }

    const r = data.result;
    const meta = r.metadata;

    const caption = `
🎵 *MUSIK DOWNLOADER* 🎵

📑 *Judul:* ${meta.title}
👤 *Artis / Channel:* ${meta.channel}
⏱ *Durasi:* ${meta.duration}
🔗 *URL Video:* ${meta.url}

_Sabar ya, audionya gue kirimin..._
    `.trim();

    // 2. Kirim cover + info lagu
    await sock.sendMessage(from, {
      image: { url: meta.cover },
      caption
    }, { quoted: msg });

    // 3. Kirim audio
    if (!r.downloadUrl) return reply("❌ Link download kosong. API lagi error.");

    await sock.sendMessage(from, {
      audio: { url: r.downloadUrl },
      mimetype: "audio/mpeg",
      fileName: `${meta.title}.mp3`
    }, { quoted: msg });

    return true; // sukses → potong limit

  } catch (err) {
    console.error("Music Downloader Plugin Error:", err);
    reply("❌ API-nya lagi error atau koneksi lo lemot.");
    return false; // error → jangan potong limit
  }
};

handler.command = ['ytplay', 'music'];
handler.limit = 2;
handler.cooldown = 10000;

export default handler;