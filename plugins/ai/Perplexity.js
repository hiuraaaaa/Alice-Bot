import fetch from "node-fetch";

const perplexityHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    if (!text) {
        return await sock.sendMessage(jid, {
            text: "Gunakan: .pplx <pertanyaan>"
        }, { quoted: m });
    }

    let processingMsg;
    try {
        processingMsg = await sock.sendMessage(jid, {
            text: "🔍 Perplexity sedang mencari jawaban..."
        }, { quoted: m });
    } catch {}

    try {
        const apiUrl = `https://api.nekolabs.web.id/text.gen/perplexity?query=${encodeURIComponent(text)}&web=true&academic=true&social=true&finance=true`;

        const res = await fetch(apiUrl);
        const data = await res.json();

        // Hapus pesan memproses
        if (processingMsg) {
            await sock.sendMessage(jid, { delete: processingMsg.key });
        }

        if (data.success && data.result?.response?.answer) {
            const answer = data.result.response.answer;

            await sock.sendMessage(jid, {
                text: `🧠 Perplexity AI:\n${answer}`
            }, { quoted: m });
        } else {
            await sock.sendMessage(jid, {
                text: "❌ Perplexity tidak bisa mendapatkan jawaban."
            }, { quoted: m });
        }

    } catch (err) {
        console.error("Error Perplexity:", err);

        if (processingMsg) {
            try { await sock.sendMessage(jid, { delete: processingMsg.key }); } catch {}
        }

        await sock.sendMessage(jid, {
            text: `❌ Terjadi kesalahan: ${err.message}`
        }, { quoted: m });
    }
};

perplexityHandler.help = ["pplx"];
perplexityHandler.tags = ["ai"];
perplexityHandler.command = /^pplx$/i;

export default perplexityHandler;