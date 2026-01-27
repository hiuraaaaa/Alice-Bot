import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const DASHX_KEY = "DHX-B0516D"; // ganti sesuai key-mu
const DASHX_API = "https://api.dashx.dpdns.org";
const MAX_RETRIES = 3;

const handler = async (m, { sock, reply }) => {
  try {
    // 1. Cek gambar
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);
    if (!msg || !msg.imageMessage) {
      return reply(`Send or reply to an image with ${global.prefix}colorize`);
    }

    await reply(global.mess.wait);

    // 2. Download gambar
    const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // 3. Upload ke server dengan retry
    let imageUrl = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const form = new FormData();
        form.append('file', buffer, { filename: 'upload.jpg', contentType: 'image/jpeg' });

        const uploadRes = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
          method: 'POST',
          body: form,
          headers: form.getHeaders(),
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.result) {
          imageUrl = uploadData.result;
          break;
        }
      } catch (err) {
        console.error(`Upload attempt ${attempt} failed:`, err);
        if (attempt === MAX_RETRIES) return reply('❌ Failed to upload image after multiple attempts.');
      }
    }

    // 4. Panggil API colorize
    const apiRes = await fetch(`${DASHX_API}/api/AI/colorize?image=${encodeURIComponent(imageUrl)}&key=${DASHX_KEY}`);
    const apiData = await apiRes.json();
    if (!apiData.success || !apiData.data?.result_url) return reply('❌ Failed to colorize image.');

    const resultUrl = apiData.data.result_url;

    // 5. Kirim hasil ke user
    await sock.sendMessage(m.key.remoteJid, {
      image: { url: resultUrl },
      caption: "✅ Image colorized successfully!"
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    await reply('❌ An error occurred while processing the image.');
  }
};

handler.help = ["colorize"];
handler.tags = ["ai"];
handler.command = /^(colorize|color)$/i;

export default handler;