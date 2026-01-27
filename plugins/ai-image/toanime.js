import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const handler = async (m, { sock }) => {
  try {
    // 1. Deteksi gambar
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

    if (!msg?.imageMessage) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { text: "❌ *Kirim atau reply gambar!*\n\n_Contoh: Kirim foto wajah lalu ketik .toanime_" },
        { quoted: m }
      );
    }

    await sock.sendMessage(
      m.key.remoteJid,
      { text: "⏳ *Converting to anime...*\n_Mohon tunggu sebentar..._" },
      { quoted: m }
    );

    // 2. Download gambar ke buffer
    const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // 3. Upload ke server untuk dapat URL publik
    const form = new FormData();
    form.append('file', buffer, {
      filename: 'upload.jpg',
      contentType: 'image/jpeg',
    });

    const uploadRes = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });
    const uploadData = await uploadRes.json();

    if (!uploadData.success || !uploadData.result) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { text: '❌ Gagal upload gambar ke server.' },
        { quoted: m }
      );
    }

    const imageUrl = uploadData.result;

    // 4. Panggil API img2anime (return binary image, bukan JSON!)
    const apiUrl = `https://fathurweb.qzz.io/api/ai/img2anime?url=${encodeURIComponent(imageUrl)}`;
    const response = await fetch(apiUrl);

    // Cek apakah response adalah gambar
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
      return await sock.sendMessage(
        m.key.remoteJid,
        { text: '❌ Gagal convert gambar ke anime.\n_Pastikan gambar berisi wajah manusia._' },
        { quoted: m }
      );
    }

    // 5. Ambil buffer gambar hasil
    const resultBuffer = await response.buffer();

    // 6. Kirim hasil ke user
    await sock.sendMessage(
      m.key.remoteJid,
      {
        image: resultBuffer,
        caption: "✅ *Anime Conversion Complete!*\n\n_Your photo has been converted to anime style_ ✨"
      },
      { quoted: m }
    );

  } catch (error) {
    console.error('[IMG2ANIME] Error:', error);
    await sock.sendMessage(
      m.key.remoteJid,
      { text: `❌ *Terjadi kesalahan!*\n\n_Error: ${error.message}_` },
      { quoted: m }
    );
  }
};

handler.help = ["toanime", "img2anime"];
handler.tags = ["ai-image"];
handler.command = /^(toanime|img2anime|anime)$/i;

export default handler;