// file: plugins/tools/remini.js
import { downloadContentFromMessage } from 'baileys';
import fetch from 'node-fetch';
import FormData from 'form-data';

const reminiHandler = async (m, { sock, reply }) => {
    try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

        if (!msg || !msg.imageMessage) {
            return reply(`_📸 Kirim atau balas gambar dengan perintah *${global.prefix}remini*_`);
        }

        // Loading
        await reply("_⏳ Sedang memproses gambar, mohon tunggu..._");

        // 1. Download gambar WhatsApp
        const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 2. Upload gambar ke CDN (NekoLabs)
        const form = new FormData();
        form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

        const uploadRes = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
        });

        const uploadJson = await uploadRes.json();
        if (!uploadJson.success || !uploadJson.result) {
            return reply('_❌ Gagal mengunggah gambar ke CDN._');
        }

        const imageUrl = uploadJson.result;

        // 3. Request ke API Remini (BALIKANNYA BUFFER, BUKAN JSON!)
        const apiURL = `https://kuronekoapies.movanest.xyz/api/tools/remini?url=${encodeURIComponent(imageUrl)}&method=4&size=high`;

        const reminiResponse = await fetch(apiURL);

        if (!reminiResponse.ok)
            return reply('_❌ API Remini error._');

        // Ambil hasil sebagai buffer (gambar)
        const resultBuffer = Buffer.from(await reminiResponse.arrayBuffer());

        // 4. Kirim hasil ke user
        await sock.sendMessage(m.key.remoteJid, {
            image: resultBuffer,
            mimetype: 'image/jpeg',
            caption: "_✨ Enhanced by Remini HD!_"
        }, { quoted: m });

    } catch (err) {
        console.error(err);
        reply('_❌ Terjadi error di fitur Remini HD._');
    }
};

reminiHandler.help = ["remini"];
reminiHandler.tags = ["tools"];
reminiHandler.command = /^(remini|hd|enhance)$/i;

export default reminiHandler;