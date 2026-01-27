import fetch from "node-fetch";

const handler = async (m, { sock, args, text }) => {
  try {
    // Ambil URL dari args atau quoted message
    const input = text || m.quoted?.text || null;
    
    if (!input) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { 
          text: `❌ *URL YouTube tidak ditemukan!*\n\n*Cara penggunaan:*\n.ytmp3 <url>\n\n*Contoh:*\n.ytmp3 https://youtu.be/pCo8oBJF9XY` 
        },
        { quoted: m }
      );
    }

    // Extract URL
    const urlPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = input.match(urlPattern);
    const url = match ? match[0] : input;

    // Kirim pesan loading
    await sock.sendMessage(
      m.key.remoteJid,
      { text: "⏳ *Mengunduh audio dari YouTube...*\n_Mohon tunggu sebentar..._" },
      { quoted: m }
    );

    // Fetch dari API
    const apiUrl = `https://fathurweb.qzz.io/api/download/ytmp3?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.status || !data.result) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { text: "❌ *Gagal mengunduh!*\n_Pastikan URL YouTube valid dan dapat diakses._" },
        { quoted: m }
      );
    }

    const result = data.result;

    // Susun caption
    let caption = `✅ *YouTube MP3 Downloader*\n\n`;
    caption += `🎵 *Title:* ${result.title}\n`;
    caption += `🎧 *Quality:* ${result.quality.toUpperCase()}\n\n`;
    caption += `_© Alice Assistant_`;

    // Kirim audio
    await sock.sendMessage(
      m.key.remoteJid,
      {
        audio: { url: result.download_url },
        mimetype: "audio/mpeg",
        fileName: `${result.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: result.title,
            body: "YouTube MP3 Downloader",
            thumbnail: { url: result.thumbnail },
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: m }
    );

    // Kirim caption terpisah (opsional)
    await sock.sendMessage(
      m.key.remoteJid,
      { text: caption },
      { quoted: m }
    );

  } catch (error) {
    console.error("[YTMP3] Error:", error);
    await sock.sendMessage(
      m.key.remoteJid,
      { 
        text: `❌ *Terjadi kesalahan!*\n\n_Error: ${error.message}_\n\n_Silakan coba lagi atau hubungi owner jika masalah berlanjut._` 
      },
      { quoted: m }
    );
  }
};

handler.help = ["ytmp3"];
handler.tags = ["download"];
handler.command = /^(ytmp3|yta|youtubemp3|ytaudio)$/i;

export default handler;