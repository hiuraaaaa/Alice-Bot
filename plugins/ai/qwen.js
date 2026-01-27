// file: plugins/ai/qwen.js
import fetch from "node-fetch";

const qwenHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    // Cek input teks
    if (!text) {
        await sock.sendMessage(jid, { text: "Gunakan: .qwen <pertanyaan>" }, { quoted: m });
        return;
    }

    // Kirim pesan "Memproses..."
    let processingMsg;
    try {
        processingMsg = await sock.sendMessage(jid, { text: "🤖 Memproses AI..." }, { quoted: m });
    } catch (err) {
        console.error("Gagal mengirim pesan memproses:", err);
        return;
    }

    try {
        // API Qwen
        const apiUrl = `https://fathurweb.qzz.io/api/ai/qwen?q=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        // Hapus pesan proses
        if (processingMsg) {
            await sock.sendMessage(jid, { delete: processingMsg.key });
        }

        // Validasi hasil API
        if (data.status && data.answer) {
            const aiResponse = `🤖 Qwen:\n${data.answer}`;

            // Jika panjang > 4000, potong
            if (aiResponse.length > 4000) {
                await sock.sendMessage(
                    jid,
                    {
                        text: aiResponse.slice(0, 4000) +
                            "\n\n⚠️ (Jawaban terlalu panjang, telah dipotong)"
                    },
                    { quoted: m }
                );
            } else {
                await sock.sendMessage(jid, { text: aiResponse }, { quoted: m });
            }

        } else {
            await sock.sendMessage(jid, { text: "❌ Gagal mendapatkan jawaban dari AI." }, { quoted: m });
        }

    } catch (err) {
        console.error("Error di qwenHandler:", err);

        // Hapus pesan memproses jika error
        if (processingMsg) {
            try {
                await sock.sendMessage(jid, { delete: processingMsg.key });
            } catch (delErr) {
                console.error("Gagal menghapus pesan memproses:", delErr);
            }
        }

        // Kirim pesan error
        await sock.sendMessage(
            jid,
            { text: `❌ Terjadi kesalahan: ${err.message}` },
            { quoted: m }
        );
    }
};

qwenHandler.help = ["qwen"];
qwenHandler.tags = ["ai"];
qwenHandler.command = /^qwen$/i;

export default qwenHandler;