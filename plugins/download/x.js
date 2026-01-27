import fetch from "node-fetch";

const handler = async (m, { sock, args, text }) => {
  try {
    // Ambil URL dari args atau quoted message
    const input = text || m.quoted?.text || null;
    
    if (!input) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { 
          text: `❌ *URL Twitter/X tidak ditemukan!*\n\n*Cara penggunaan:*\n.twitter <url>\n\n*Contoh:*\n.twitter https://x.com/i/status/1893204252488814898` 
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
      { text: "⏳ *Mengunduh dari Twitter/X...*\n_Mohon tunggu sebentar..._" },
      { quoted: m }
    );

    // Fetch dari API
    const apiUrl = `https://fathurweb.qzz.io/api/download/twitter?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.status || !data.result) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { text: "❌ *Gagal mengunduh!*\n_Pastikan URL Twitter/X valid dan dapat diakses._" },
        { quoted: m }
      );
    }

    const result = data.result;

    // Susun caption
    let caption = `✅ *Twitter/X Downloader*\n\n`;
    caption += `🎬 *Title:* ${result.videoTitle}\n`;
    if (result.videoDescription) {
      caption += `📝 *Description:* ${result.videoDescription}\n`;
    }
    caption += `\n_© Alice Assistant_`;

    // Kirim video dengan thumbnail
    await sock.sendMessage(
      m.key.remoteJid,
      {
        video: { url: result.downloadLink },
        caption: caption,
        mimetype: "video/mp4",
        contextInfo: {
          externalAdReply: {
            title: result.videoTitle,
            body: "Twitter/X Video Downloader",
            thumbnail: { url: result.imgUrl },
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: m }
    );

  } catch (error) {
    console.error("[TWITTER] Error:", error);
    await sock.sendMessage(
      m.key.remoteJid,
      { 
        text: `❌ *Terjadi kesalahan!*\n\n_Error: ${error.message}_\n\n_Silakan coba lagi atau hubungi owner jika masalah berlanjut._` 
      },
      { quoted: m }
    );
  }
};

handler.help = ["twitter", "x"];
handler.tags = ["download"];
handler.command = /^(twitter|x|twitterdl|xdl)$/i;

export default handler;