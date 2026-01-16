// file: plugins/tools/removebg.js
import { downloadContentFromMessage } from 'baileys';
import fetch from 'node-fetch';
import FormData from 'form-data';

const REMOVE_BG_APIKEY = 'freeApikey'; // ganti kalau punya API key sendiri

const removeBgHandler = async (m, { sock, reply }) => {
    try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

        if (!msg || !msg.imageMessage) {
            return reply(`Kirim atau balas gambar dengan perintah *${global.prefix}removebg*`);
        }

        await reply(global.mess.wait);

        // 1. Download gambar dari WhatsApp
        const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 2. Upload ke API Remove Background (Anabot)
        // Kita buat FormData karena endpoint menerima URL, jadi kita bisa unggah ke temporary uploader
        const form = new FormData();
        form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

        // Upload gambar ke Anabot atau bisa pake server uploader lain dulu
        const uploadRes = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
        });
        const uploadData = await uploadRes.json();

        if (!uploadData.success || !uploadData.result) {
            return reply('❌ Gagal mengunggah gambar.');
        }

        const imageUrl = uploadData.result;

        // 3. Panggil API remove background
        const removeRes = await fetch(`https://anabot.my.id/api/ai/removebg?imageUrl=${encodeURIComponent(imageUrl)}&apikey=${REMOVE_BG_APIKEY}`);
        const removeData = await removeRes.json();

        if (removeData.success && removeData.data?.result) {
            await sock.sendMessage(m.key.remoteJid, {
                image: { url: removeData.data.result },
                caption: "✅ Background berhasil dihapus!"
            }, { quoted: m });
        } else {
            reply('❌ Gagal menghapus background.');
        }
    } catch (err) {
        console.error(err);
        reply('❌ Terjadi kesalahan saat memproses remove background.');
    }
};

removeBgHandler.help = ["removebg"];
removeBgHandler.tags = ["tools"];
removeBgHandler.command = /^(removebg)$/i;

export default removeBgHandler;