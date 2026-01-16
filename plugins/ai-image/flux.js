import fetch from "node-fetch";

const fluxHandler = async (m, { sock, text }) => {
    if (!text) {
        await sock.sendMessage(m.key.remoteJid, {
            text: `❗ Masukkan prompt untuk generate gambar\nContoh: ${global.prefix}flux Girl anime`
        }, { quoted: m });
        return false; // plugin gagal → jangan kurangi limit
    }

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, {
        text: "⏳ Sedang generate gambar, harap tunggu..."
    }, { quoted: m });

    try {
        const apiUrl = `https://api.nekolabs.web.id/image.gen/flux/dev?prompt=${encodeURIComponent(text)}&ratio=9:16`;
        const res = await fetch(apiUrl, { timeout: 60000 });
        const data = await res.json();

        if (!data.success || !data.result) {
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Gagal generate gambar." }, { quoted: m });
            return false; // plugin gagal → jangan kurangi limit
        }

        await sock.sendMessage(m.key.remoteJid, {
            image: { url: data.result },
            caption: `🎨 Gambar hasil generate:\nPrompt: ${text}`
        }, { quoted: m });

        await sock.sendMessage(m.key.remoteJid, { delete: loadingMsg.key });

        return true; // plugin sukses → handler utama boleh kurangi limit
    } catch (err) {
        console.error(err);
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Terjadi kesalahan saat generate gambar." }, { quoted: m });
        return false; // plugin gagal → jangan kurangi limit
    }
};

fluxHandler.help = ["flux"];
fluxHandler.tags = ["ai"];
fluxHandler.command = /^(flux)$/i;
fluxHandler.limit = false; // flag limit, handler utama yg pakai
fluxHandler.cooldown = 60000; // optional, cooldown per user

export default fluxHandler;