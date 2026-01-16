import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const aliceHandler = async (m, { sock, reply }) => {
    try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

        if (!msg || !msg.imageMessage) {
            return reply(`❗ Kirim atau balas gambar dengan perintah *${global.prefix}tourl*`);
        }

        await reply(global.mess.wait);

        const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const form = new FormData();
        form.append('file', buffer, {
            filename: 'upload.jpg',
            contentType: 'image/jpeg',
        });

        const response = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
        });

        const data = await response.json();

        if (data.success && data.result) {
            await reply(
                `✅ *UPLOAD SUCCESS*\n\n` +
                `🔗 *URL:* ${data.result}\n` +
                `⏱️ *Response:* ${data.responseTime}`
            );
            return true;
        } else {
            await reply('❌ Gagal mengunggah gambar ke server.');
            return false;
        }
    } catch (err) {
        console.error(err);
        await reply('❌ Terjadi kesalahan saat memproses gambar.');
        return false;
    }
};

aliceHandler.help = ["tourl"];
aliceHandler.tags = ["tools"];
aliceHandler.command = /^(tourl)$/i;
aliceHandler.limit = true;
aliceHandler.cooldown = 5000;

export default aliceHandler;
