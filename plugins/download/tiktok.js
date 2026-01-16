import fetch from "node-fetch";

const robinHandler = async (m, { sock, text }) => {
    if (!text) {
        await sock.sendMessage(m.key.remoteJid, { text: "Masukkan link TikTok!" }, { quoted: m });
        return false; // <-- Sinyalkan ke handler utama: jangan kurangi limit
    }

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "⏳ Sedang memproses video TikTok..." }, { quoted: m });

    try {
        const apiUrl = `https://api.nekolabs.web.id/downloader/tiktok?url=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl, { timeout: 15000 });
        const data = await res.json();

        if (!data.success || !data.result?.videoUrl) {
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Gagal mendapatkan video TikTok dari API." }, { quoted: m });
            return false; // <-- Sinyalkan ke handler utama: jangan kurangi limit
        }

        const videoUrl = data.result.videoUrl;

        await sock.sendMessage(m.key.remoteJid, {
            video: { url: videoUrl },
            caption: "🎬 Video TikTok berhasil didownload!"
        }, { quoted: m });

        await sock.sendMessage(m.key.remoteJid, { delete: loadingMsg.key });

        return true; // <-- Sinyalkan ke handler utama: limit boleh dikonsumsi

    } catch (err) {
        console.error(err);
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Terjadi kesalahan saat mengunduh TikTok." }, { quoted: m });
        return false; // <-- Sinyalkan ke handler utama: jangan kurangi limit karena error
    }
};

robinHandler.help = ["download"];
robinHandler.tags = ["download"];
robinHandler.command = /^(tiktok|tt|robin)$/i;
robinHandler.limit = 5;
robinHandler.cooldown = 10000;

export default robinHandler;