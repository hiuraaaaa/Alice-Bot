// file: plugins/ai/editfoto.js
import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const editFotoHandler = async (m, { sock, text }) => {
  const chatJid = m.key.remoteJid;

  try {
    // 1. Validasi Prompt (Instruksi)
    if (!text) {
      return await sock.sendMessage(chatJid, { 
        text: "❗ Masukkan instruksi editnya.\nContoh: .editfoto ganti pesawat" 
      }, { quoted: m });
    }

    // 2. Ccekk apakah ada gambar yang dikirim atau di-reply
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

    if (!msg || !msg.imageMessage) {
      return await sock.sendMessage(chatJid, { 
        text: "❌ Silakan kirim atau balas gambar dengan perintah .editfoto <instruksi>" 
      }, { quoted: m });
    }

    await sock.sendMessage(chatJid, { text: "⏳ Sedang memproses editan foto, mohon tunggu..." }, { quoted: m });

    // 3. Download gambar dari WhatsApp
    const stream = await downloadContentFromMessage(msg.imageMessage, "image");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    // 4. Upload ke Uploader (NekoLabs) untuk mendapatkan URL
    const form = new FormData();
    form.append("file", buffer, { filename: "edit.jpg", contentType: "image/jpeg" });

    const uploadRes = await fetch("https://api.nekolabs.web.id/tools/uploader/alibaba", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success) throw new Error("Gagal mengunggah gambar ke server.");

    const imageUrl = uploadData.result;

    // 5. Eksekusi API Edit Foto (Faa)
    const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(text)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error("API Faa sedang mengalami gangguan.");

    const resultBuffer = await res.buffer(); // Mengambil hasil gambar langsung

    // 6. Kirim hasil editan kembali ke user
    await sock.sendMessage(chatJid, { 
      image: resultBuffer, 
      caption: `✨ *EDIT FOTO AI SUCCESS*\n\n📝 *Prompt:* ${text}\n\n_Processed by Alice-Bot_`
    }, { quoted: m });

  } catch (err) {
    console.error("[EDITFOTO ERROR]", err);
    await sock.sendMessage(chatJid, { 
      text: `❌ *Error:* ${err.message || "Terjadi kesalahan teknis."}` 
    }, { quoted: m });
  }
};

editFotoHandler.help = ["editfoto"];
editFotoHandler.tags = ["ai"];
editFotoHandler.command = /^(editfoto)$/i;

export default editFotoHandler;