import fetch from "node-fetch";

const ciciHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    // Jika user tidak memberikan teks
    if (!text) {
        return await sock.sendMessage(jid, {
            text: "Gunakan: .cici <pertanyaan>"
        }, { quoted: m });
    }

    // Pesan memproses
    let processingMsg;
    try {
        processingMsg = await sock.sendMessage(jid, {
            text: "🤖 Cici AI sedang memikirkan..."
        }, { quoted: m });
    } catch (err) {
        console.error("Gagal kirim pesan memproses:", err);
    }

    try {
        const apiUrl = `https://api.nekolabs.web.id/text.gen/cici-ai?text=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        // Hapus pesan memproses
        if (processingMsg) {
            await sock.sendMessage(jid, { delete: processingMsg.key });
        }

        // Cek format API
        if (data.success && data.result?.chat) {
            await sock.sendMessage(jid, {
                text: `💗 Cici-AI:\n${data.result.chat}`
            }, { quoted: m });
        } else {
            await sock.sendMessage(jid, {
                text: "❌ Gagal mendapatkan jawaban dari Cici-AI."
            }, { quoted: m });
        }

    } catch (err) {
        console.error("Error Cici-AI:", err);

        // Hapus pesan memproses jika error
        if (processingMsg) {
            try { await sock.sendMessage(jid, { delete: processingMsg.key }); } catch {}
        }

        await sock.sendMessage(jid, {
            text: `❌ Terjadi kesalahan: ${err.message}`
        }, { quoted: m });
    }
};

ciciHandler.help = ["cici"];
ciciHandler.tags = ["ai"];
ciciHandler.command = /^cici$/i;

export default ciciHandler;