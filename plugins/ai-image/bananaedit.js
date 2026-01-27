// file: plugins/ai/banana-edit.js
import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const bananaEditHandler = async (m, { sock, text, reply }) => {
  try {
    // 1. Cek input instruksi (prompt)
    if (!text) {
      return reply(`❗ Masukkan instruksi editnya.\nContoh: *${global.prefix}banana-edit* Change hair color to white`);
    }

    // 2. Cek apakah ada gambar yang dikirim atau dibalas
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

    if (!msg || !msg.imageMessage) {
      return reply(`Balas atau kirim gambar dengan perintah *${global.prefix}banana-edit* <instruksi>`);
    }

    await reply("```\n🎨 Nano Banana Pro sedang mengolah gambar...\n```");

    // 3. Download gambar dari WhatsApp
    const stream = await downloadContentFromMessage(msg.imageMessage, "image");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // 4. Upload ke server Alibaba (NekoLabs) untuk mendapatkan URL publik
    const form = new FormData();
    form.append("file", buffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });

    const uploadRes = await fetch("https://api.nekolabs.web.id/tools/uploader/alibaba", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success || !uploadData.result) {
      return reply("❌ Gagal memproses gambar (Upload Error).");
    }

    const imageUrl = uploadData.result;

    // 5. Panggil API Nano Banana Pro Edit
    const apiUrl = `https://api.nekolabs.web.id/image.gen/nano-banana-pro?prompt=${encodeURIComponent(text)}&imageUrl=${encodeURIComponent(imageUrl)}`;
    
    // Timeout 60 detik karena response time ±30 detik
    const apiRes = await fetch(apiUrl, { timeout: 60000 });
    const apiData = await apiRes.json();

    if (apiData.success && apiData.result) {
      // 6. Kirim hasil edit ke user
      await sock.sendMessage(m.key.remoteJid, {
        image: { url: apiData.result },
        caption: `✨ *NANO BANANA PRO EDIT SUCCESS*\n\n📝 *Instruction:* ${text}\n\n_Processed by ${global.botName}_`
      }, { quoted: m });
    } else {
      reply("❌ Gagal mengedit gambar. AI tidak memberikan respon balik.");
    }

  } catch (err) {
    console.error("[BANANA-EDIT ERROR]", err);
    await reply("❌ Terjadi kesalahan saat memproses Nano Banana Edit.");
  }
};

bananaEditHandler.help = ["bananaedit"];
bananaEditHandler.tags = ["ai"];
bananaEditHandler.command = /^(bananaedit|bedit|nanogen)$/i;

export default bananaEditHandler;