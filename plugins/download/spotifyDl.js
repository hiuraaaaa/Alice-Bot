import fetch from "node-fetch";

const handler = async (m, { sock, args, text }) => {
  try {
    // Ambil URL dari args atau quoted message
    const input = text || m.quoted?.text || null;
    
    if (!input) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { 
          text: `❌ *URL Spotify tidak ditemukan!*\n\n*Cara penggunaan:*\n.spotify <url>\n\n*Contoh:*\n.spotify https://open.spotify.com/track/3eR23VReFzcdmS7TYCrhCe` 
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
      { text: "⏳ *Mengunduh dari Spotify...*\n_Mohon tunggu sebentar..._" },
      { quoted: m }
    );

    // Fetch dari API
    const apiUrl = `https://fathurweb.qzz.io/api/download/spotify?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.status || !data.result) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { text: "❌ *Gagal mengunduh!*\n_Pastikan URL Spotify valid dan dapat diakses._" },
        { quoted: m }
      );
    }

    const result = data.result;

    // Convert durasi dari milidetik ke format mm:ss
    const minutes = Math.floor(result.durasi / 60000);
    const seconds = Math.floor((result.durasi % 60000) / 1000);
    const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Susun caption
    let caption = `✅ *Spotify Downloader*\n\n`;
    caption += `🎵 *Title:* ${result.title}\n`;
    caption += `🎤 *Artist:* ${result.artis}\n`;
    caption += `⏱️ *Duration:* ${duration}\n`;
    caption += `📀 *Type:* ${result.type}\n\n`;
    caption += `_© Alice Assistant_`;

    // Kirim audio dengan thumbnail
    await sock.sendMessage(
      m.key.remoteJid,
      {
        audio: { url: result.download },
        mimetype: "audio/mpeg",
        fileName: `${result.title} - ${result.artis}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: result.title,
            body: result.artis,
            thumbnail: { url: result.image },
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      },
      { quoted: m }
    );

    // Kirim caption terpisah
    await sock.sendMessage(
      m.key.remoteJid,
      { text: caption },
      { quoted: m }
    );

  } catch (error) {
    console.error("[SPOTIFY] Error:", error);
    await sock.sendMessage(
      m.key.remoteJid,
      { 
        text: `❌ *Terjadi kesalahan!*\n\n_Error: ${error.message}_\n\n_Silakan coba lagi atau hubungi owner jika masalah berlanjut._` 
      },
      { quoted: m }
    );
  }
};

handler.help = ["spotify"];
handler.tags = ["download"];
handler.command = /^(spotify|spotifydl|spotdl)$/i;

export default handler;