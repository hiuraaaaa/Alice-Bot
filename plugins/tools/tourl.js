import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const handler = async (m, { sock, reply }) => {
    try {
        // Cek apakah ada gambar yang dikirim atau di-reply
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

        if (!msg || !msg.imageMessage) {
            return reply(`Kirim atau balas gambar dengan perintah *${global.prefix}tourl*`);
        }

        await reply(global.mess.wait);

        // Download gambar dari WhatsApp
        const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Siapkan form data untuk upload
        const form = new FormData();
        form.append('file', buffer, {
            filename: 'upload.jpg',
            contentType: 'image/jpeg',
        });

        // Upload ke API
        const response = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
        });

        const data = await response.json();

        if (data.success && data.result) {
            await reply(`*UPLOAD SUCCESS*\n\n🔗 *URL:* ${data.result}\n⏱️ *Respon:* ${data.responseTime}`);
        } else {
            await reply('❌ Gagal mengunggah gambar ke server.');
        }
    } catch (err) {
        console.error(err);
        await reply('❌ Terjadi kesalahan saat memproses gambar.');
    }
};

handler.help = ["tourl"];
handler.tags = ["tools"];
handler.command = /^(tourl)$/i;

export default handler;