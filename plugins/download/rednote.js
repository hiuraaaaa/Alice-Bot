import fetch from "node-fetch";

const handler = async (m, { sock, args, text }) => {
  try {
    // Ambil URL dari args atau quoted message
    const input = text || m.quoted?.text || null;
    
    if (!input) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { 
          text: `❌ *URL RedNote tidak ditemukan!*\n\n*Cara penggunaan:*\n.rednote <url>\n\n*Contoh:*\n.rednote http://xhslink.com/o/2Qjowa6zVSd` 
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
      { text: "⏳ *Mengunduh dari RedNote...*\n_Mohon tunggu sebentar..._" },
      { quoted: m }
    );

    // Fetch dari API
    const apiUrl = `https://fathurweb.qzz.io/api/download/rednote?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.status || !data.result) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { text: "❌ *Gagal mengunduh!*\n_Pastikan URL RedNote valid dan dapat diakses._" },
        { quoted: m }
      );
    }

    const result = data.result;

    // Susun caption
    let caption = `✅ *RedNote Downloader*\n\n`;
    caption += `👤 *Author:* ${result.nickname}\n`;
    caption += `📝 *Title:* ${result.title}\n`;
    caption += `📄 *Deskripsi:* ${result.desc}\n`;
    caption += `⏱️ *Durasi:* ${result.duration}\n\n`;
    caption += `📊 *Engagement:*\n`;
    caption += `  ❤️ Likes: ${result.engagement.likes}\n`;
    caption += `  💬 Comments: ${result.engagement.comments}\n`;
    caption += `  🔖 Collects: ${result.engagement.collects}\n\n`;
    caption += `🏷️ *Tags:* ${result.keywords}\n\n`;
    caption += `_© Alice Assistant_`;

    // Jika ada video, kirim video
    if (result.downloads && result.downloads.length > 0) {
      const videoUrl = result.downloads[0].url;
      
      await sock.sendMessage(
        m.key.remoteJid,
        {
          video: { url: videoUrl },
          caption: caption,
          mimetype: "video/mp4"
        },
        { quoted: m }
      );
    }
    // Jika hanya ada gambar, kirim gambar
    else if (result.images && result.images.length > 0) {
      await sock.sendMessage(
        m.key.remoteJid,
        {
          image: { url: result.images[0] },
          caption: caption
        },
        { quoted: m }
      );
    }
    // Jika tidak ada media
    else {
      await sock.sendMessage(
        m.key.remoteJid,
        { text: caption },
        { quoted: m }
      );
    }

  } catch (error) {
    console.error("[REDNOTE] Error:", error);
    await sock.sendMessage(
      m.key.remoteJid,
      { 
        text: `❌ *Terjadi kesalahan!*\n\n_Error: ${error.message}_\n\n_Silakan coba lagi atau hubungi owner jika masalah berlanjut._` 
      },
      { quoted: m }
    );
  }
};

handler.help = ["rednote"];
handler.tags = ["download"];
handler.command = /^(rednote|rn|xiaohongshu)$/i;

export default handler;