import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const DASHX_KEY = "DHX-B0516D"; // ganti sesuai key-mu
const DASHX_API = "https://api.dashx.dpdns.org";
const MAX_RETRIES = 3;
const CHECK_INTERVAL = 2000; // 2 detik
const MAX_CHECKS = 45; // total 90 detik max

const handler = async (m, { sock, reply }) => {
  try {
    // 1. Cek gambar
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);
    if (!msg || !msg.imageMessage) {
      return reply(`Send or reply to an image with ${global.prefix}img2gta`);
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

    // 4. Buat job img2gta
    const jobRes = await fetch(`${DASHX_API}/api/AI/img2gta?image=${encodeURIComponent(imageUrl)}&key=${DASHX_KEY}`);
    const jobData = await jobRes.json();
    if (!jobData.success || !jobData.data?.job_id) return reply('❌ Failed to create job.');

    const jobId = jobData.data.job_id;
    const checkUrl = `${DASHX_API}/api/job/img2gta?id=${jobId}&key=${DASHX_KEY}`;

    // 5. Loop cek status job tanpa progress update
    let resultUrl = null;
    for (let i = 0; i < MAX_CHECKS; i++) {
      const res = await fetch(checkUrl);
      const data = await res.json();

      if (data.success && data.data?.status === 'completed' && data.data?.result_url) {
        resultUrl = data.data.result_url;
        break;
      } else if (data.success && data.data?.status === 'failed') {
        return reply('❌ Job failed. Please try again.');
      }

      await new Promise(r => setTimeout(r, CHECK_INTERVAL));
    }

    if (!resultUrl) return reply('❌ Job did not complete in time (90s).');

    // 6. Kirim hasil ke user
    await sock.sendMessage(m.key.remoteJid, {
      image: { url: resultUrl },
      caption: "✅ GTA-style image ready!"
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    await reply('❌ An error occurred while processing the image.');
  }
};

handler.help = ["img2gta"];
handler.tags = ["ai"];
handler.command = /^(img2gta|gta)$/i;

export default handler;