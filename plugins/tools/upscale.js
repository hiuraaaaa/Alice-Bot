import { downloadContentFromMessage } from 'baileys';
import FormData from 'form-data';
import fetch from 'node-fetch';

const handler = async (m, { sock, reply }) => {
    try {
        // Cek apakah ada gambar yang dikirim atau di-reply
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

        if (!msg || !msg.imageMessage) {
            return reply(`Kirim atau balas gambar dengan perintah *${global.prefix}upscale*`);
        }

        await reply(global.mess.wait);

        // 1. Download gambar dari WhatsApp
        const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 2. Upload ke API Alibaba (ToURL)
        const form = new FormData();
        form.append('file', buffer, {
            filename: 'upload.jpg',
            contentType: 'image/jpeg',
        });

        const uploadRes = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
        });
        const uploadData = await uploadRes.json();

        if (!uploadData.success || !uploadData.result) {
            return reply('❌ Gagal mengunggah gambar ke server uploader.');
        }

        const imageUrl = uploadData.result;

        // 3. Panggil API Upscale (ihancer)
        const upscaleUrl = `https://api.nekolabs.web.id/tools/upscale/ihancer?imageUrl=${encodeURIComponent(imageUrl)}&size=high`;
        const upscaleRes = await fetch(upscaleUrl);
        const upscaleData = await upscaleRes.json();

        if (upscaleData.success && upscaleData.result) {
            // 4. Kirim hasil gambar berkualitas tinggi kembali ke user
            await sock.sendMessage(m.key.remoteJid, { 
                image: { url: upscaleData.result },
                caption: `*UPSCALE SUCCESS*\n\n✨ *Kualitas:* High\n⏱️ *Respon:* ${upscaleData.responseTime}`
            }, { quoted: m });
        } else {
            await reply('❌ Gagal meningkatkan kualitas gambar.');
        }
    } catch (err) {
        console.error(err);
        await reply('❌ Terjadi kesalahan saat memproses upscale.');
    }
};

handler.help = ["upscale"];
handler.tags = ["tools"];
handler.command = /^(upscale|hd)$/i;

export default handler;