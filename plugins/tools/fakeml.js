import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';
import * as jimp from 'jimp';

const Jimp = jimp.default || jimp;

const CDN_URL = 'https://api.nekolabs.web.id/tools/uploader/alibaba';
const BG_URL = 'http://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/background%20.png';
const BORDER_URL = 'http://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/border.png';

const handler = async (m, { sock, reply, text }) => {
  try {
    let username = text?.trim() || 'hiura';

    const context = m.message?.extendedTextMessage?.contextInfo;
    const quoted = context?.quotedMessage;

    const imgMsg =
      m.message?.imageMessage
        ? m.message
        : quoted?.imageMessage
        ? { imageMessage: quoted.imageMessage }
        : null;

    if (!imgMsg || !imgMsg.imageMessage) {
      return reply(`Kirim atau reply gambar dengan perintah *${global.prefix}fakeml username*`);
    }

    await reply("```\nProcessing...\n```");

    // === Download image WA ===
    const stream = await downloadContentFromMessage(imgMsg.imageMessage, 'image');
    let imgBuffer = Buffer.from([]);
    for await (const chunk of stream) imgBuffer = Buffer.concat([imgBuffer, chunk]);

    // === FIX: PAKSA konversi format gambar jadi PNG dulu sebelum Jimp.read ===
    let safeImage;
    try {
      const tmpImg = await Jimp.read(imgBuffer); // baca format original
      safeImage = await tmpImg.getBufferAsync(Jimp.MIME_PNG); // convert paksa PNG
    } catch (err) {
      console.log("FORMAT ERROR:", String(err));
      return reply("❌ Gambar tidak bisa diproses (format tidak dikenali).");
    }

    // === Baca ulang sebagai PNG ===
    const profile = await Jimp.read(safeImage);

    // === Resize 500x500 ===
    profile.cover(500, 500);
    const profileBuffer = await profile.getBufferAsync(Jimp.MIME_PNG);

    // === Upload CDN ===
    const form = new FormData();
    form.append('file', profileBuffer, {
      filename: `ml_${Date.now()}.png`,
      contentType: 'image/png'
    });

    const uploadRes = await fetch(CDN_URL, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success) return reply("❌ Gagal upload ke CDN");

    const bg = await Jimp.read(BG_URL);
    const border = await Jimp.read(BORDER_URL);
    const profileReady = await Jimp.read(profileBuffer);

    bg.composite(profileReady, 70, 70);
    bg.composite(border, 0, 0);

    const finalBuffer = await bg.getBufferAsync(Jimp.MIME_PNG);

    await sock.sendMessage(
      m.key.remoteJid,
      {
        image: finalBuffer,
        caption: `✅ Fake ML Profile created!\n👤 Username: *${username}*`
      },
      { quoted: m }
    );

  } catch (e) {
    console.log("FAKEML ERROR:", String(e));
    reply("❌ Error: " + String(e));
  }
};

handler.command = /^fakeml$/i;
handler.tags = ['tools'];
handler.help = ['fakeml username'];

export default handler;