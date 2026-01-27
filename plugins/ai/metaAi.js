// file: plugins/ai/metaai.js
import fetch from "node-fetch";

const metaAiHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    // Cek teks
    if (!text) {
        await sock.sendMessage(jid, { text: "Gunakan: .metaai <pertanyaan>" }, { quoted: m });
        return;
    }

    // Kirim pesan "Memproses..."
    let processingMsg;
    try {
        processingMsg = await sock.sendMessage(
            jid,
            { text: "🤖 Memproses AI..." },
            { quoted: m }
        );
    } catch (err) {
        console.error("Gagal kirim pesan memproses:", err);
        return;
    }

    try {
        // API MetaAI
        const apiUrl = `https://fathurweb.qzz.io/api/ai/metaai?q=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        // Hapus pesan memproses
        if (processingMsg) {
            await sock.sendMessage(jid, { delete: processingMsg.key });
        }

        // Validasi respon API
        if (data.status && data.answer) {
            const reply = `🤖 MetaAI (${data.model}):\n${data.answer}`;

            // Jika terlalu panjang
            if (reply.length > 4000) {
                await sock.sendMessage(
                    jid,
                    { text: reply.slice(0, 4000) + "\n\n⚠️ (Jawaban terlalu panjang, sebagian dipotong)" },
                    { quoted: m }
                );
            } else {
                await sock.sendMessage(jid, { text: reply }, { quoted: m });
            }

        } else {
            await sock.sendMessage(jid, { text: "❌ Gagal mendapatkan jawaban dari MetaAI." }, { quoted: m });
        }

    } catch (err) {
        console.error("Error di metaAiHandler:", err);

        // Hapus pesan memproses jika error
        if (processingMsg) {
            try {
                await sock.sendMessage(jid, { delete: processingMsg.key });
            } catch (delErr) {
                console.error("Gagal hapus pesan memproses:", delErr);
            }
        }

        await sock.sendMessage(jid, { text: `❌ Terjadi kesalahan: ${err.message}` }, { quoted: m });
    }
};

metaAiHandler.help = ["metaai"];
metaAiHandler.tags = ["ai"];
metaAiHandler.command = /^metaai$/i;

export default metaAiHandler;