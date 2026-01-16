import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const handler = async (m, { sock, reply }) => {
  try {
    // 1️⃣ cek apakah ada gambar yang dikirim/balas
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage
      ? m.message
      : quoted?.imageMessage
      ? quoted
      : null;

    if (!msg || !msg.imageMessage) {
      return reply(`Send or reply to an image with the command *${global.prefix}tohitam*`);
    }

    await reply("```\nProcessing...\n```");

    // 2️⃣ Download gambar dari WhatsApp
    const stream = await downloadContentFromMessage(msg.imageMessage, "image");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // 3️⃣ Upload ke server untuk dapat URL publik
    const form = new FormData();
    form.append("file", buffer, {
      filename: "upload.jpg",
      contentType: "image/jpeg",
    });

    const uploadRes = await fetch("https://api.nekolabs.web.id/tools/uploader/alibaba", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success || !uploadData.result) {
      return reply("❌ Failed to upload image to the server.");
    }

    const imageUrl = uploadData.result; // URL publik gambar WA

    // 4️⃣ Panggil API tohitam
    const apiUrl = `https://api-faa.my.id/faa/tohitam?url=${encodeURIComponent(imageUrl)}`;
    const apiRes = await fetch(apiUrl);

    // 🤖 API ini langsung kirim gambar → baca sebagai buffer
    const resultBuffer = await apiRes.arrayBuffer();
    const finalBuffer = Buffer.from(resultBuffer);

    // 5️⃣ Kirim hasil ke user
    await sock.sendMessage(m.key.remoteJid, {
      image: finalBuffer,
      mimetype: 'image/jpeg', // ⚡ wajib supaya WA kirim sebagai gambar
      caption: "✅ Image processed successfully (tohitam)!"
    }, { quoted: m });

  } catch (err) {
    console.error("[TOHITAM ERROR]", err);
    await reply("❌ An error occurred while processing the image.");
  }
};

handler.help = ["tohitam"];
handler.tags = ["tools"];
handler.command = /^(tohitam|hitam)$/i;

export default handler;