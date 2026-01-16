import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const handler = async (m, { sock, reply }) => {
  try {
    // 1. Cek apakah ada gambar yang dikirim atau di-reply
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

    if (!msg || !msg.imageMessage) {
      return reply(`Send or reply to an image with the command *${global.prefix}removebg*`);
    }

    await reply(global.mess.wait);

    // 2. Download gambar dari WhatsApp
    const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    // 3. Upload ke server agar dapat URL publik
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
      return reply('❌ Failed to upload image to the server.');
    }

    const imageUrl = uploadData.result; // URL publik dari uploader

    // 4. Panggil API Remove Background HD
    const removeUrl = `https://api.offmonprst.my.id/api/removebghd?url=${encodeURIComponent(imageUrl)}`;
    const removeRes = await fetch(removeUrl);
    const removeData = await removeRes.json();

    if (!removeData?.result?.url) {
      return reply('❌ Failed to remove background.');
    }

    const outputUrl = removeData.result.url;

    // 5. Kirim hasil ke user dengan monospace (code block)
    await sock.sendMessage(m.key.remoteJid, {
      image: { url: outputUrl },
      caption: "```\n✅ Background removed successfully!\n```"
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    await reply('❌ An error occurred while removing the background.');
  }
};

handler.help = ["removebghd"];
handler.tags = ["tools"];
handler.command = /^(removebghd|rmbghd)$/i;

export default handler;