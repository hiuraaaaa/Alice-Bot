// file: plugins/ai/openai.js
import fetch from "node-fetch";

const openaiHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    // Cek input
    if (!text) {
        await sock.sendMessage(jid, { text: "Gunakan: .openai <pertanyaan>" }, { quoted: m });
        return;
    }

    // Kirim pesan "Memproses..."
    let processingMsg;
    try {
        processingMsg = await sock.sendMessage(jid, { text: "🤖 Memproses AI..." }, { quoted: m });
    } catch (err) {
        console.error("Gagal kirim pesan memproses:", err);
        return;
    }

    try {
        // API OpenAI FathurWeb
        const apiUrl = `https://fathurweb.qzz.io/api/ai/openai?text=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        // Hapus pesan memproses
        if (processingMsg) {
            await sock.sendMessage(jid, { delete: processingMsg.key });
        }

        // Validasi
        if (data.status && data.result) {
            const result = `🤖 OpenAI:\n${data.result}`;

            // Batasi kalau terlalu panjang
            if (result.length > 4000) {
                await sock.sendMessage(
                    jid,
                    { text: result.slice(0, 4000) + "\n\n⚠️ (Jawaban sangat panjang, sudah dipotong)" },
                    { quoted: m }
                );
            } else {
                await sock.sendMessage(jid, { text: result }, { quoted: m });
            }

        } else {
            await sock.sendMessage(jid, { text: "❌ Gagal mendapatkan jawaban dari AI." }, { quoted: m });
        }

    } catch (err) {
        console.error("Error di openaiHandler:", err);

        // Hapus pesan memproses jika error
        if (processingMsg) {
            try {
                await sock.sendMessage(jid, { delete: processingMsg.key });
            } catch (e) {
                console.error("Gagal hapus pesan memproses:", e);
            }
        }

        // Kirim error ke user
        await sock.sendMessage(jid, { text: `❌ Terjadi kesalahan: ${err.message}` }, { quoted: m });
    }
};

openaiHandler.help = ["openai"];
openaiHandler.tags = ["ai"];
openaiHandler.command = /^openai$/i;

export default openaiHandler;