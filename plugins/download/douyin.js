// file: plugins/downloader/douyin_faa.js
import fetch from "node-fetch";

const douyinFaaHandler = async (m, { sock, text }) => {
    const chatJid = m.key.remoteJid;

    if (!text) return sock.sendMessage(chatJid, { text: "❗ Masukkan link Douyin." }, { quoted: m });

    try {
        const apiUrl = `https://api-faa.my.id/faa/douyin-down?url=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.status && data.result) {
            // Mengambil media dengan type 'video'
            const videoData = data.result.medias.find(m => m.type === "video");

            if (videoData) {
                await sock.sendMessage(chatJid, { 
                    video: { url: videoData.url },
                    caption: `🎬 *DOUYIN DOWNLOADER (FAA)*\n\n📌 *Title:* ${data.result.title}\n🌐 *Platform:* ${data.result.platform}`,
                    mimetype: 'video/mp4'
                }, { quoted: m });
            } else {
                await sock.sendMessage(chatJid, { text: "❌ Link video tidak ditemukan dalam hasil." }, { quoted: m });
            }
        } else {
            await sock.sendMessage(chatJid, { text: "❌ Gagal mengambil data dari Douyin." }, { quoted: m });
        }
    } catch (e) {
        console.error(e);
        await sock.sendMessage(chatJid, { text: "❌ Terjadi kesalahan pada API Faa." }, { quoted: m });
    }
};

douyinFaaHandler.help = ['douyin'];
douyinFaaHandler.tags = ['downloader'];
douyinFaaHandler.command = /^(douyin|douyinfaa)$/i;

export default douyinFaaHandler;