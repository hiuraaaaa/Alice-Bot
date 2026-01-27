// file: plugins/maker/magicstudio.js
import fetch from "node-fetch";

const magicStudioHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    if (!text) {
        return await sock.sendMessage(jid, { 
            text: `❗ Masukkan prompt gambarnya.\nContoh: .mstudio girl anime in china` 
        }, { quoted: m });
    }

    await sock.sendMessage(jid, { text: "⏳ Magic Studio sedang memproses gambar..." }, { quoted: m });

    try {
        const apiUrl = `https://api.zenzxz.my.id/api/maker/magicstudio?prompt=${encodeURIComponent(text)}`;
        
        // Kita ambil responnya sebagai arrayBuffer
        const res = await fetch(apiUrl);
        
        if (!res.ok) throw new Error("Server API Error");

        const buffer = await res.buffer(); // Mengambil data mentah gambar

        // Cek apakah yang dikirim beneran gambar atau malah teks error
        if (buffer.toString().includes('{"status":false')) {
            return await sock.sendMessage(jid, { text: "❌ API sedang limit atau error." }, { quoted: m });
        }

        // Kirim ke WA. Apapun formatnya (PNG/JPG/WebP), Baileys akan otomatis handle.
        await sock.sendMessage(jid, { 
            image: buffer, 
            caption: `✨ *MAGIC STUDIO RESULT*\n\n📝 *Prompt:* ${text}`
        }, { quoted: m });

    } catch (e) {
        console.error("[MAGICSTUDIO ERROR]", e);
        await sock.sendMessage(jid, { text: "❌ Terjadi kesalahan teknis." }, { quoted: m });
    }
};

magicStudioHandler.help = ['magicstudio'];
magicStudioHandler.tags = ['maker'];
magicStudioHandler.command = /^(magicstudio|mstudio)$/i;

export default magicStudioHandler;