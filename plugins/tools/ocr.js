// file: plugins/tools/ocr.js
import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const ocrHandler = async (m, { sock }) => {
  const chatJid = m.key.remoteJid;

  try {
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

    if (!msg || !msg.imageMessage) {
      return await sock.sendMessage(chatJid, { 
        text: "❌ Balas gambar yang ada teksnya dengan perintah *.ocr*" 
      }, { quoted: m });
    }

    await sock.sendMessage(chatJid, { text: "🔍 Sedang memindai teks..." }, { quoted: m });

    // 1. Download & Upload ke NekoLabs
    const stream = await downloadContentFromMessage(msg.imageMessage, "image");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    const form = new FormData();
    form.append("file", buffer, { filename: "ocr.jpg", contentType: "image/jpeg" });

    const uploadRes = await fetch("https://api.nekolabs.web.id/tools/uploader/alibaba", {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success) throw new Error("Gagal mengunggah gambar.");

    const imageUrl = uploadData.result;

    // 2. Eksekusi API OCR Zenitsu
    const apiUrl = `https://api.zenitsu.web.id/api/tools/ocr?imgUrl=${encodeURIComponent(imageUrl)}`;
    const apiRes = await fetch(apiUrl);
    const data = await apiRes.json();

    // 3. Penyesuaian ke properti 'results'
    if (data.results && data.results.trim() !== "") {
      let message = `📝 *HASIL OCR*\n\n`;
      message += `\`\`\`${data.results.trim()}\`\`\`\n\n`;
      message += `👤 *Attribution:* ${data.attribution || "-"}\n`;
      message += `⏰ *Time:* ${data.timestamp ? new Date(data.timestamp).toLocaleString() : "-"}\n`;
      message += `\n_Processed by ${global.botName || "Alice-Bot"}_`;

      await sock.sendMessage(chatJid, { text: message }, { quoted: m });
    } else {
      await sock.sendMessage(chatJid, { 
        text: "❌ Teks tidak ditemukan dalam gambar tersebut." 
      }, { quoted: m });
    }

  } catch (err) {
    console.error("[OCR ERROR]", err);
    await sock.sendMessage(chatJid, { 
        text: `❌ *Error:* ${err.message || "Gagal menghubungi server OCR."}` 
    }, { quoted: m });
  }
};

ocrHandler.help = ["ocr"];
ocrHandler.tags = ["tools"];
ocrHandler.command = /^(ocr)$/i;

export default ocrHandler;