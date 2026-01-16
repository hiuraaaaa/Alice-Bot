import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const handler = async (m, { sock, reply, text }) => {
  try {
    // 1. Cek apakah ada gambar
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);
    if (!msg || !msg.imageMessage) {
      return reply(`Send or reply to an image with *${global.prefix}bgchange* and provide a prompt`);
    }
    if (!text) return reply(`Please provide a prompt!\nExample: *${global.prefix}bgchange Beach*`);

    await reply("```\nProcessing...\n```");

    // 2. Download image dari WhatsApp
    const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // 3. Upload agar dapat URL publik
    const form = new FormData();
    form.append('file', buffer, { filename: 'upload.jpg', contentType: 'image/jpeg' });
    const uploadRes = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
      method: 'POST', body: form, headers: form.getHeaders()
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success || !uploadData.result) return reply('❌ Failed to upload image.');
    const imageUrl = uploadData.result;

    // 4. Panggil API bgchange → langsung dapat image
    const apiUrl = `https://api-faa.my.id/faa/nano-banana?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(text)}`;
    const apiRes = await fetch(apiUrl);

    // Baca response sebagai buffer
    const resultBuffer = await apiRes.arrayBuffer();
    const finalBuffer = Buffer.from(resultBuffer);

    // 5. Kirim ke user dengan paksa MIME type image/jpeg
    await sock.sendMessage(m.key.remoteJid, {
      image: finalBuffer,
      mimetype: 'image/jpeg',
      caption: "✅ Background replaced successfully!"
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    await reply('❌ An error occurred while replacing the background.');
  }
};

handler.help = ["bgchange"];
handler.tags = ["tools"];
handler.command = /^(bgchange|bgreplace)$/i;

export default handler;