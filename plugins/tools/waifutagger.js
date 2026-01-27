// file: plugins/tools/waifutagger.js
import { downloadContentFromMessage } from 'baileys';
import fetch from 'node-fetch';
import FormData from 'form-data';

const waifuTaggerHandler = async (m, { sock, reply }) => {
    try {
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

        if (!msg || !msg.imageMessage) {
            return reply(`Kirim atau balas gambar dengan perintah *${global.prefix}waifutagger*`);
        }

        await reply(global.mess.wait || "Sedang menganalisis gambar...");

        // 1. Download gambar dari WhatsApp
        const stream = await downloadContentFromMessage(msg.imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 2. Upload ke temporary uploader (Alibaba)
        const form = new FormData();
        form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

        const uploadRes = await fetch('https://api.nekolabs.web.id/tools/uploader/alibaba', {
            method: 'POST',
            body: form,
            headers: form.getHeaders(),
        });
        const uploadData = await uploadRes.json();

        if (!uploadData.success || !uploadData.result) {
            return reply('❌ Gagal mengunggah gambar ke server.');
        }

        const imageUrl = uploadData.result;

        // 3. Panggil API Waifu Tagger
        const taggerRes = await fetch(`https://api.nekolabs.web.id/tools/finder/waifu-tagger?imageUrl=${encodeURIComponent(imageUrl)}`);
        const taggerData = await taggerRes.json();

        if (taggerData.success && taggerData.result) {
            const res = taggerData.result;
            
            // Menyusun teks output
            let caption = `🔍 *WAIFU TAGGER RESULT*\n\n`;
            
            // Nama Karakter (Jika terdeteksi)
            if (res.character && res.character.name) {
                caption += `👤 *Character:* ${res.character.name}\n`;
            }

            // Rating/Kandungan Konten
            const topRating = res.rating[0];
            caption += `🔞 *Rating:* ${topRating.label} (${(topRating.confidence * 100).toFixed(2)}%)\n\n`;

            // Prompt/Tags
            caption += `🏷️ *Prompt:* \n\`\`\`${res.prompt}\`\`\`\n\n`;

            // List Tags Teratas
            caption += `✨ *Top Tags:* \n`;
            const topTags = res.tags.confidences.slice(0, 10).map(t => `- ${t.label}`).join('\n');
            caption += topTags;

            await reply(caption);
        } else {
            reply('❌ Gagal mendapatkan data tag dari gambar tersebut.');
        }
    } catch (err) {
        console.error(err);
        reply('❌ Terjadi kesalahan saat memproses gambar.');
    }
};

waifuTaggerHandler.help = ["waifutagger"];
waifuTaggerHandler.tags = ["tools"];
waifuTaggerHandler.command = /^(waifutagger|waifutag|detektanime)$/i;

export default waifuTaggerHandler;