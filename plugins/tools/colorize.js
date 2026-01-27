import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';
import crypto from 'crypto';

const handler = async (m, { sock, reply }) => {
  try {
    // 1. Ambil gambar dari chat atau reply
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);
    
    if (!msg || !msg.imageMessage) {
      return reply(`Kirim atau reply gambar hitam putih dengan caption *${global.prefix}colorize*`);
    }

    await reply("```\nSedang mewarnai foto... Mohon tunggu.\n```");

    // 2. Download image dari WhatsApp menjadi Buffer
    const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // 3. Upload ke CDN Alibaba agar dapat URL publik (Teknik yang kamu suka)
    const formUpload = new FormData();
    formUpload.append('file', buffer, { filename: 'colorize.jpg', contentType: 'image/jpeg' });
    const uploadRes = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
      method: 'POST', body: formUpload, headers: formUpload.getHeaders()
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success || !uploadData.result) return reply('❌ Gagal mengunggah gambar ke CDN.');
    const imageUrl = uploadData.result;

    // 4. Proses Colorize AI
    const productSerial = crypto.randomUUID();
    
    // Step A: Buat Job
    const createJobForm = new FormData();
    // Kita tembak URL gambar dari CDN tadi sebagai stream
    const imgStream = await fetch(imageUrl).then(res => res.body);
    createJobForm.append('original_image_file', imgStream, { filename: 'image.png' });

    const createReq = await fetch('https://api.unblurimage.ai/api/imgupscaler/v2/ai-image-colorize/create-job', {
      method: 'POST',
      body: createJobForm,
      headers: {
        ...createJobForm.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)',
        'Product-Serial': productSerial,
        'origin': 'https://unblurimage.ai',
        'referer': 'https://unblurimage.ai/'
      }
    });
    const createRes = await createReq.json();
    const jobId = createRes.result?.job_id;
    if (!jobId) return reply('❌ Gagal membuat antrean AI.');

    // Step B: Polling hasil sampai selesai
    let outputUrl = null;
    while (!outputUrl) {
      await new Promise(r => setTimeout(r, 3000)); // Tunggu 3 detik setiap cek
      const checkReq = await fetch(`https://api.unblurimage.ai/api/imgupscaler/v2/ai-image-colorize/get-job/${jobId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)',
          'Product-Serial': productSerial
        }
      });
      const checkRes = await checkReq.json();
      if (checkRes.code === 100000 && checkRes.result?.output_url) {
        outputUrl = checkRes.result.output_url;
      }
    }

    // 5. Kirim hasil balik ke user
    await sock.sendMessage(m.key.remoteJid, {
      image: { url: outputUrl },
      caption: "✅ *Berhasil diwarnai!*"
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    await reply('❌ Terjadi kesalahan saat memproses pewarnaan gambar.');
  }
};

handler.help = ["colorize"];
handler.tags = ["tools"];
handler.command = /^(colorize|warnain)$/i;

export default handler;