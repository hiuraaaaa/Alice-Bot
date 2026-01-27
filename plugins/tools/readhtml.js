// file: plugins/tools/readhtml.js
import fetch from "node-fetch";

const readHtmlHandler = async (m, { sock, text }) => {
    // 1. Validasi input URL
    if (!text) {
        return await sock.sendMessage(m.key.remoteJid, { 
            text: `❗ Masukkan URL website yang ingin diambil HTML-nya.\nContoh: ${global.prefix}readhtml https://api.nekolabs.web.id` 
        }, { quoted: m });
    }

    // Pastikan input adalah URL yang valid
    const urlRegex = /https?:\/\/[^\s$.?#].[^\s]*/g;
    const targetUrl = text.match(urlRegex);

    if (!targetUrl) {
        return await sock.sendMessage(m.key.remoteJid, { text: "❌ URL tidak valid. Pastikan menyertakan http:// atau https://" }, { quoted: m });
    }

    await sock.sendMessage(m.key.remoteJid, { text: "🌐 Sedang mengambil source code HTML..." }, { quoted: m });

    try {
        // 2. Panggil API Rjina NekoLabs dengan format=html
        const apiUrl = `https://api.nekolabs.web.id/tools/rjina?url=${encodeURIComponent(targetUrl[0])}&format=html`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.success && data.result) {
            let content = data.result;

            // WhatsApp punya limit karakter (sekitar 65rb), 
            // karena HTML sangat panjang, kita potong jika lebih dari 15rb karakter
            if (content.length > 15000) {
                content = content.slice(0, 15000) + "\n\n...(Konten HTML terlalu panjang, dipotong)";
            }

            const message = `📄 *HTML SOURCE CODE*\n` +
                            `🔗 *Source:* ${targetUrl[0]}\n` +
                            `------------------------------------\n\n` +
                            "```html\n" + content + "\n```";

            await sock.sendMessage(m.key.remoteJid, { text: message }, { quoted: m });
        } else {
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Gagal mengambil HTML dari website tersebut." }, { quoted: m });
        }
    } catch (err) {
        console.error("[READHTML ERROR]", err);
        await sock.sendMessage(m.key.remoteJid, { text: `❌ Terjadi kesalahan: ${err.message}` }, { quoted: m });
    }
};

// Pengaturan Command
readHtmlHandler.help = ['readhtml'];
readHtmlHandler.tags = ['tools'];
readHtmlHandler.command = /^(readhtml|gethtml)$/i;

export default readHtmlHandler;