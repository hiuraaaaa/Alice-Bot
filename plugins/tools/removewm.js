import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const handler = async (m, { sock, reply }) => {
  try {
    // 1. Cek apakah ada gambar yang dikirim atau di-reply
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

    if (!msg || !msg.imageMessage) {
      return reply(`Kirim atau balas gambar dengan perintah *${global.prefix}removewm*`);
    }

    await reply(global.mess.wait);

    // 2. Download gambar dari WhatsApp
    const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // 3. Upload ke CDN Neko
    const form = new FormData();
    form.append('file', buffer, { filename: 'upload.jpg', contentType: 'image/jpeg' });

    const uploadRes = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success || !uploadData.result) {
      return reply('❌ Gagal mengunggah gambar ke CDN Neko.');
    }

    const imageUrl = uploadData.result;
    console.log('[REMOVEMWM] Uploaded URL:', imageUrl);

    // 4. Panggil API Snowping Remove Watermark
    const apiURL = `https://api.snowping.my.id/api/tools/removewm?url=${encodeURIComponent(imageUrl)}`;
    const removeRes = await fetch(apiURL);
    const removeData = await removeRes.json();

    if (!removeData?.result?.output) {
      return reply('❌ Gagal menghapus watermark dengan API Snowping.');
    }

    const outputUrl = removeData.result.output;

    // 5. Kirim hasil ke user
    await sock.sendMessage(
      m.key.remoteJid,
      {
        image: { url: outputUrl },
        caption: `✅ Watermark berhasil dihapus!\n⏱️ Response: ${removeData.responseTime}ms\n🔗 Source: ${imageUrl}`
      },
      { quoted: m }
    );

  } catch (err) {
    console.error(err);
    await reply('❌ Terjadi kesalahan saat menghapus watermark.');
  }
};

handler.help = ["removewm"];
handler.tags = ["tools"];
handler.command = /^(removewm|rmwm)$/i;

export default handler;