// file: plugins/ai/qwen-edit.js
import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const qwenEditHandler = async (m, { sock, text, reply }) => {
  try {
    // 1. Cek apakah ada prompt (instruksi edit)
    if (!text) {
      return reply(`❗ Masukkan instruksi editnya.\nContoh: *${global.prefix}qwen-edit* Change background to Cyberpunk City`);
    }

    // 2. Cek gambar yang dikirim atau dibalas
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

    if (!msg || !msg.imageMessage) {
      return reply(`Balas atau kirim gambar dengan perintah *${global.prefix}qwen-edit* <instruksi>`);
    }

    await reply(global.mess?.wait || "```\nSedang mengedit gambar...\n```");

    // 3. Download gambar dari WhatsApp
    const stream = await downloadContentFromMessage(msg.imageMessage, "image");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // 4. Upload ke server Alibaba (NekoLabs) untuk dapat URL publik
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
      return reply("❌ Gagal mengunggah gambar ke server uploader.");
    }

    const imageUrl = uploadData.result;

    // 5. Panggil API Qwen Image Edit
    const apiUrl = `https://api.nekolabs.web.id/image.gen/qwen/image-edit?prompt=${encodeURIComponent(text)}&imageUrl=${encodeURIComponent(imageUrl)}`;
    const apiRes = await fetch(apiUrl);
    const apiData = await apiRes.json();

    if (apiData.success && apiData.result) {
      // 6. Kirim hasil akhir ke user
      await sock.sendMessage(m.key.remoteJid, {
        image: { url: apiData.result },
        caption: `✨ *QWEN IMAGE EDIT SUCCESS*\n\n📝 *Prompt:* ${text}\n\n_Edited by ${global.botName}_`
      }, { quoted: m });
    } else {
      reply("❌ Gagal mengedit gambar. API tidak memberikan hasil.");
    }

  } catch (err) {
    console.error("[QWEN-EDIT ERROR]", err);
    await reply("❌ Terjadi kesalahan saat memproses pengeditan gambar.");
  }
};

qwenEditHandler.help = ["qwenedit"];
qwenEditHandler.tags = ["ai"];
qwenEditHandler.command = /^(qwenedit|qedit|editimg)$/i;

export default qwenEditHandler;