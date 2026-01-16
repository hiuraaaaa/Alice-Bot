import fetch from "node-fetch";

const aliceHandler = async (m, { sock, text }) => {
    if (!text) {
        await sock.sendMessage(m.key.remoteJid, { 
            text: `❗ Masukkan link TikTok\nContoh: ${global.prefix}tiktok https://vt.tiktok.com/xxx` 
        }, { quoted: m });
        return false;
    }

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { 
        text: global.mess.wait 
    }, { quoted: m });

    try {
        const apiUrl = `https://api.nekolabs.web.id/downloader/tiktok?url=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl, { timeout: 15000 });
        const data = await res.json();

        if (!data.success || !data.result?.videoUrl) {
            await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ Gagal mengunduh video TikTok." 
            }, { quoted: m });
            return false;
        }

        await sock.sendMessage(m.key.remoteJid, {
            video: { url: data.result.videoUrl },
            caption: "🎬 *TikTok Downloader*\n\n✅ Video berhasil diunduh!"
        }, { quoted: m });

        await sock.sendMessage(m.key.remoteJid, { delete: loadingMsg.key });

        return true;
    } catch (err) {
        console.error(err);
        await sock.sendMessage(m.key.remoteJid, { 
            text: "❌ Terjadi kesalahan saat mengunduh video." 
        }, { quoted: m });
        return false;
    }
};

aliceHandler.help = ["tiktok", "tt"];
aliceHandler.tags = ["downloader"];
aliceHandler.command = /^(tiktok|tt)$/i;
aliceHandler.limit = 2;
aliceHandler.cooldown = 10000;

export default aliceHandler;
