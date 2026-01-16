import fetch from "node-fetch";

const aliceHandler = async (m, { sock, text }) => {
    if (!text) {
        await sock.sendMessage(m.key.remoteJid, { 
            text: `❗ Masukkan pertanyaan\nContoh: ${global.prefix}gpt Apa itu AI?` 
        }, { quoted: m });
        return false;
    }

    await sock.sendMessage(m.key.remoteJid, { 
        text: global.mess.wait 
    }, { quoted: m });

    try {
        const apiUrl = `https://api.nekolabs.web.id/text.gen/gpt/5-nano?text=${encodeURIComponent(text)}&systemPrompt=Sistem+promt&sessionId=neko`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data.success || !data.result) {
            await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ Gagal mendapatkan jawaban dari AI." 
            }, { quoted: m });
            return false;
        }

        await sock.sendMessage(m.key.remoteJid, { 
            text: `💬 *GPT-5 Nano*\n\n${data.result}` 
        }, { quoted: m });

        return true;
    } catch (err) {
        console.error(err);
        await sock.sendMessage(m.key.remoteJid, { 
            text: "❌ Terjadi kesalahan saat memproses AI." 
        }, { quoted: m });
        return false;
    }
};

aliceHandler.help = ["gpt"];
aliceHandler.tags = ["ai"];
aliceHandler.command = /^(gpt)$/i;
aliceHandler.limit = false;
aliceHandler.cooldown = 5000;

export default aliceHandler;
