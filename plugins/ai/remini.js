import { downloadContentFromMessage } from 'baileys';
import fetch from 'node-fetch';
import FormData from 'form-data';

const aliceHandler = async (m, { sock, reply }) => {
    try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

        if (!msg || !msg.imageMessage) {
            return reply(`❗ Kirim atau balas gambar dengan perintah *${global.prefix}remini*`);
        }

        await reply(global.mess.wait);

        const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const form = new FormData();
        form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

        const uploadRes = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
        });

        const uploadJson = await uploadRes.json();
        if (!uploadJson.success || !uploadJson.result) {
            await reply('❌ Gagal mengunggah gambar ke CDN.');
            return false;
        }

        const imageUrl = uploadJson.result;
        const apiURL = `https://kuronekoapies.movanest.xyz/api/tools/remini?url=${encodeURIComponent(imageUrl)}&method=4&size=high`;

        const reminiResponse = await fetch(apiURL);

        if (!reminiResponse.ok) {
            await reply('❌ API Remini error.');
            return false;
        }

        const resultBuffer = Buffer.from(await reminiResponse.arrayBuffer());

        await sock.sendMessage(m.key.remoteJid, {
            image: resultBuffer,
            mimetype: 'image/jpeg',
            caption: "✨ *Enhanced by Remini HD*"
        }, { quoted: m });

        return true;
    } catch (err) {
        console.error(err);
        await reply('❌ Terjadi kesalahan saat memproses gambar.');
        return false;
    }
};

aliceHandler.help = ["remini", "hd", "enhance"];
aliceHandler.tags = ["tools"];
aliceHandler.command = /^(remini|hd|enhance)$/i;
aliceHandler.limit = true;
aliceHandler.cooldown = 10000;

export default aliceHandler;
