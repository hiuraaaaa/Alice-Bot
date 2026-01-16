import { downloadContentFromMessage } from 'baileys';
import axios from 'axios';
import FormData from 'form-data';

const toAnimeHandler = async (m, { sock, reply, from, args }) => {
    try {
        // 1. Cek gambar
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const msg = m.message?.imageMessage ? m.message : (quoted?.imageMessage ? quoted : null);

        if (!msg || !msg.imageMessage) {  
            return reply(`🎨 Kirim atau balas gambar dengan perintah *${global.prefix}toanime*\n\n💡 Contoh:\n• Kirim gambar + caption: ${global.prefix}toanime\n• Reply gambar: ${global.prefix}toanime\n\n🎭 Model tersedia:\n• ${global.prefix}toanime 1 - Anime Style 1\n• ${global.prefix}toanime 2 - Anime Style 2\n• ${global.prefix}toanime 3 - Anime Style 3\n• ${global.prefix}toanime 4 - Anime Style 4\n• ${global.prefix}toanime 5 - Anime Style 5 (default)`);  
        }  

        const modelId = args[0] ? parseInt(args[0]) : 5;  
        if (modelId < 1 || modelId > 5) return reply('❌ Model ID harus antara 1-5!');  

        await reply('🎨 Sedang mengkonversi foto ke anime...\n⏳ Mohon tunggu 10-60 detik...');

        // 2. Download gambar dari WA
        const stream = await downloadContentFromMessage(msg.imageMessage, 'image');  
        let buffer = Buffer.from([]);  
        for await (const chunk of stream) {  
            buffer = Buffer.concat([buffer, chunk]);  
        }

        // 3. Upload ke CDN sementara
        const form = new FormData();
        form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });

        const uploadRes = await axios.post('https://api.nekolabs.web.id/tools/uploader/alibaba', form, {
            headers: form.getHeaders(),
            timeout: 60000
        });

        if (!uploadRes.data.success || !uploadRes.data.result) {
            return reply('❌ Gagal mengunggah gambar ke CDN.');
        }

        const imageUrl = uploadRes.data.result;
        console.log(`[TOANIME] Uploaded image to CDN: ${imageUrl}`);

        // 4. Settings API AI enhancer
        const settings = "L7p91uXhVyp5OOJthAyqjSqhlbM+RPZ8+h2Uq9tz6Y+4Agarugz8f4JjxjEycxEzuj/7+6Q0YY9jUvrfmqkucENhHAkMq1EOilzosQlw2msQpW2yRqV3C/WqvP/jrmSu3aUVAyeFhSbK3ARzowBzQYPVHtxwBbTWwlSR4tehnodUasnmftnY77c8gIFtL2ArNdzmPLx5H8O9un2U8WE4s7O2FxvQPCjt2uGmHPMOx1DsNSnLvzCKPVdz8Ob1cPHePmmquQZlsb/p+8gGv+cizSiOL4ts6GD2RxWN+K5MmpA/F3rQXanFUm4EL0g7qZCQbChRRQyaAyZuxtIdTKsmsMzkVKM5Sx96eV7bEjUAJ52j6NcP96INv2DhnWTP7gB6tltFQe8B8SPS2LuLRuPghA==";

        // 5. Create task ke AI enhancer pakai URL CDN
        const createResponse = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/create', {  
            model: modelId,  
            image: imageUrl,  // pakai URL CDN
            settings: settings
        }, {  
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0',
                'Origin': 'https://aienhancer.ai',
                'Referer': 'https://aienhancer.ai/photo-to-anime-converter'
            },
            timeout: 60000
        });

        if (!createResponse.data.data?.id) return reply('❌ Gagal membuat task konversi. Coba lagi nanti.');

        const taskId = createResponse.data.data.id;

        // 6. Polling hasil (lebih tahan lama)
        let resultUrl = null;
        let attempts = 0;
        const maxAttempts = 30; // maksimal 1-1.5 menit
        const delayMs = 3000;

        while (!resultUrl && attempts < maxAttempts) {
            attempts++;
            await new Promise(r => setTimeout(r, delayMs));

            try {
                const resultResponse = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/result', {  
                    task_id: taskId  
                }, { headers: { 'Content-Type': 'application/json' }, timeout: 60000 });

                const status = resultResponse.data.data?.status;
                const output = resultResponse.data.data?.output;

                if (status === 'success' && output) {
                    resultUrl = output;
                    console.log(`[TOANIME] Task success: ${resultUrl}`);
                } else if (status === 'failed') {
                    return reply('❌ Konversi gagal di server. Coba model/gambar lain.');
                } else {
                    console.log(`[TOANIME] Attempt ${attempts}: Status ${status || 'pending'}`);
                }
            } catch (e) {
                console.log(`[TOANIME POLL ERROR] Attempt ${attempts}:`, e.message);
            }
        }

        if (!resultUrl) return reply('❌ Timeout! Proses terlalu lama. Silakan coba lagi.');

        // 7. Download hasil dan kirim ke WA
        const downloadResponse = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 60000 });
        const resultBuffer = Buffer.from(downloadResponse.data);

        await sock.sendMessage(from, {
            image: resultBuffer,
            caption: `✅ *Konversi ke Anime Berhasil!*\n🎨 Model: Anime Style ${modelId}\n📏 Size: ${(resultBuffer.length / 1024).toFixed(2)} KB`
        }, { quoted: m });

    } catch (error) {
        console.error('[TOANIME ERROR]:', error);
        reply('❌ Terjadi kesalahan saat konversi gambar. Coba lagi.');
    }
};

toAnimeHandler.help = ["toanime"];
toAnimeHandler.tags = ["ai-image"];
toAnimeHandler.command = /^(toanime|anime|photo2anime)$/i;
toAnimeHandler.limit = 3;

export default toAnimeHandler;