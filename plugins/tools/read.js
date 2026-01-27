// file: plugins/tools/webreader.js
import fetch from "node-fetch";

const webReaderHandler = async (m, { sock, text }) => {
    // 1. Validasi input URL
    if (!text) {
        return await sock.sendMessage(m.key.remoteJid, { 
            text: `❗ Masukkan URL website yang ingin dibaca.\nContoh: ${global.prefix}read https://api.nekolabs.web.id` 
        }, { quoted: m });
    }

    // Pastikan input adalah URL yang valid
    const urlRegex = /https?:\/\/[^\s$.?#].[^\s]*/g;
    const targetUrl = text.match(urlRegex);

    if (!targetUrl) {
        return await sock.sendMessage(m.key.remoteJid, { text: "❌ URL tidak valid. Pastikan menyertakan http:// atau https://" }, { quoted: m });
    }

    await sock.sendMessage(m.key.remoteJid, { text: "🔍 Sedang membaca isi website..." }, { quoted: m });

    try {
        // 2. Panggil API Rjina NekoLabs
        const apiUrl = `https://api.nekolabs.web.id/tools/rjina?url=${encodeURIComponent(targetUrl[0])}&format=markdown`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.success && data.result) {
            // Jika konten terlalu panjang, kita potong agar tidak melebihi limit karakter WhatsApp (±65000 karakter)
            let content = data.result;
            if (content.length > 10000) {
                content = content.slice(0, 10000) + "\n\n...(Konten dipotong karena terlalu panjang)";
            }

            const caption = `🌐 *WEB READER RESULT*\n` +
                            `🔗 *Source:* ${targetUrl[0]}\n` +
                            `------------------------------------\n\n` +
                            content;

            await sock.sendMessage(m.key.remoteJid, { text: caption }, { quoted: m });
        } else {
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Gagal mengambil konten dari website tersebut." }, { quoted: m });
        }
    } catch (err) {
        console.error("[WEB-READER ERROR]", err);
        await sock.sendMessage(m.key.remoteJid, { text: `❌ Terjadi kesalahan: ${err.message}` }, { quoted: m });
    }
};

// Pengaturan Command
webReaderHandler.help = ['read', 'scrape', 'rjina'];
webReaderHandler.tags = ['tools'];
webReaderHandler.command = /^(read|scrape|rjina)$/i;

export default webReaderHandler;