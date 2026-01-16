import fetch from 'node-fetch';
import { Buffer } from 'buffer';

const aliceHandler = async (m, { sock, reply, text }) => {
    if (!text) {
        return reply(`❗ Masukkan prompt untuk generate gambar\nContoh: ${global.prefix}blink Cute cat`);
    }

    await reply(global.mess.wait);

    try {
        const payload = {
            prompt: text,
            userAPIKey: "",
            iterativeMode: false
        };

        const response = await fetch('https://www.blinkshot.io/api/generateImages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data || !data.b64_json) {
            await reply('❌ Gagal generate gambar.');
            return false;
        }

        const imageBuffer = Buffer.from(data.b64_json, 'base64');

        await sock.sendMessage(m.key.remoteJid, {
            image: imageBuffer,
            caption: `✅ Gambar berhasil dibuat!\n⏱️ Inference: ${data.timings?.inference || 'N/A'}ms`
        }, { quoted: m });

        return true;
    } catch (err) {
        console.error(err);
        await reply('❌ Terjadi kesalahan saat generate gambar.');
        return false;
    }
};

aliceHandler.help = ['blink'];
aliceHandler.tags = ['ai'];
aliceHandler.command = /^(blink)$/i;
aliceHandler.limit = true;
aliceHandler.cooldown = 30000;

export default aliceHandler;
