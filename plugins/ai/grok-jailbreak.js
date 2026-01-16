import fetch from "node-fetch";

const aliceHandler = async (m, { sock, text }) => {
    if (!text) {
        await sock.sendMessage(m.key.remoteJid, { 
            text: `❗ Masukkan pertanyaan\nContoh: ${global.prefix}grok Apa itu AI?` 
        }, { quoted: m });
        return false;
    }

    await sock.sendMessage(m.key.remoteJid, { 
        text: global.mess.wait 
    }, { quoted: m });

    try {
        const apiUrl = `https://api.nekolabs.web.id/text.gen/grok/3-jailbreak/v2?text=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data?.result || typeof data.result !== "string") {
            await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ Gagal mendapatkan jawaban dari Grok." 
            }, { quoted: m });
            return false;
        }

        await sock.sendMessage(m.key.remoteJid, { 
            text: `💬 *Grok AI*\n\n${data.result}` 
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

aliceHandler.help = ["grok"];
aliceHandler.tags = ["ai"];
aliceHandler.command = /^(grok)$/i;
aliceHandler.limit = false;
aliceHandler.cooldown = 5000;

export default aliceHandler;
