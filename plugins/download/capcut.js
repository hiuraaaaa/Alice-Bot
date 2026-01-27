import fetch from "node-fetch";

const handler = async (m, { sock, args, text }) => {
  try {
    // Ambil URL dari args atau quoted message
    const input = text || m.quoted?.text || null;
    
    if (!input) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { 
          text: `❌ *URL CapCut tidak ditemukan!*\n\n*Cara penggunaan:*\n.capcut <url>\n\n*Contoh:*\n.capcut https://www.capcut.com/tv2/ZSaNtYoW5/` 
        },
        { quoted: m }
      );
    }

    // Extract URL
    const urlPattern = /https?:\/\/[^\s]+/;
    const match = input.match(urlPattern);
    const url = match ? match[0] : input;

    // Kirim pesan loading
    await sock.sendMessage(
      m.key.remoteJid,
      { text: "⏳ *Mengunduh template dari CapCut...*\n_Mohon tunggu sebentar..._" },
      { quoted: m }
    );

    // Fetch dari API
    const apiUrl = `https://fathurweb.qzz.io/api/download/capcut?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.status || !data.result) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { text: "❌ *Gagal mengunduh!*\n_Pastikan URL CapCut valid dan dapat diakses._" },
        { quoted: m }
      );
    }

    const result = data.result;

    // Susun caption
    let caption = `✅ *CapCut Template Downloader*\n\n`;
    caption += `🎬 *Title:* ${result.title}\n`;
    caption += `👤 *Author:* ${result.author.name}\n`;
    caption += `📅 *Date:* ${result.date}\n`;
    caption += `👥 *Uses:* ${result.pengguna}\n`;
    caption += `❤️ *Likes:* ${result.likes}\n\n`;
    caption += `_© Alice Assistant_`;

    // Kirim video dengan thumbnail
    await sock.sendMessage(
      m.key.remoteJid,
      {
        video: { url: result.videoUrl },
        caption: caption,
        mimetype: "video/mp4",
        contextInfo: {
          externalAdReply: {
            title: result.title,
            body: `By ${result.author.name}`,
            thumbnail: { url: result.posterUrl },
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: m }
    );

  } catch (error) {
    console.error("[CAPCUT] Error:", error);
    await sock.sendMessage(
      m.key.remoteJid,
      { 
        text: `❌ *Terjadi kesalahan!*\n\n_Error: ${error.message}_\n\n_Silakan coba lagi atau hubungi owner jika masalah berlanjut._` 
      },
      { quoted: m }
    );
  }
};

handler.help = ["capcut"];
handler.tags = ["download"];
handler.command = /^(capcut|capcutdl|cctemplate)$/i;

export default handler;