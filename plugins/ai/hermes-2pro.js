import fetch from "node-fetch";

const hermesHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    // Kalau user tidak isi text
    if (!text) {
        return await sock.sendMessage(jid, { 
            text: "Gunakan: .hermes <pertanyaan>" 
        }, { quoted: m });
    }

    // Tampilkan pesan memproses
    let processingMsg;
    try {
        processingMsg = await sock.sendMessage(jid, { 
            text: "🤖 Memproses AI Hermes..." 
        }, { quoted: m });
    } catch (err) {
        console.error("Gagal kirim pesan memproses:", err);
    }

    try {
        const apiUrl = `https://api.nekolabs.web.id/text.gen/cf/hermes-2-pro?text=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        // Hapus pesan memproses
        if (processingMsg) {
            await sock.sendMessage(jid, { delete: processingMsg.key });
        }

        // Cek respons API
        if (data.success && data.result) {
            const reply = `🦊 Hermes AI:\n${data.result}`;
            await sock.sendMessage(jid, { text: reply }, { quoted: m });
        } else {
            await sock.sendMessage(jid, { 
                text: "❌ Gagal mendapatkan jawaban dari Hermes." 
            }, { quoted: m });
        }

    } catch (err) {
        console.error("Error Hermes:", err);

        if (processingMsg) {
            try {
                await sock.sendMessage(jid, { delete: processingMsg.key });
            } catch {}
        }

        await sock.sendMessage(jid, { 
            text: `❌ Terjadi kesalahan: ${err.message}` 
        }, { quoted: m });
    }
};

hermesHandler.help = ["hermes"];
hermesHandler.tags = ["ai"];
hermesHandler.command = /^hermes$/i;

export default hermesHandler;