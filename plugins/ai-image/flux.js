import fetch from "node-fetch";

const aliceHandler = async (m, { sock, text }) => {
    if (!text) {
        await sock.sendMessage(m.key.remoteJid, {
            text: `❗ Masukkan prompt untuk generate gambar\nContoh: ${global.prefix}flux Girl anime`
        }, { quoted: m });
        return false;
    }

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, {
        text: global.mess.wait
    }, { quoted: m });

    try {
        const apiUrl = `https://api.nekolabs.web.id/image.gen/flux/dev?prompt=${encodeURIComponent(text)}&ratio=9:16`;
        const res = await fetch(apiUrl, { timeout: 60000 });
        const data = await res.json();

        if (!data.success || !data.result) {
            await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ Gagal generate gambar." 
            }, { quoted: m });
            return false;
        }

        await sock.sendMessage(m.key.remoteJid, {
            image: { url: data.result },
            caption: `🎨 Gambar hasil generate:\nPrompt: ${text}`
        }, { quoted: m });

        await sock.sendMessage(m.key.remoteJid, { delete: loadingMsg.key });

        return true;
    } catch (err) {
        console.error(err);
        await sock.sendMessage(m.key.remoteJid, { 
            text: "❌ Terjadi kesalahan saat generate gambar." 
        }, { quoted: m });
        return false;
    }
};

aliceHandler.help = ["flux"];
aliceHandler.tags = ["ai"];
aliceHandler.command = /^(flux)$/i;
aliceHandler.limit = 5;
aliceHandler.cooldown = 60000;

export default aliceHandler;
