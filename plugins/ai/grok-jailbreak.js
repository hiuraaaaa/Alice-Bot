import fetch from "node-fetch";

let grokHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;
    if (!text) return await sock.sendMessage(jid, { text: "Gunakan: .grok <pertanyaan>" }, { quoted: m });

    await sock.sendMessage(jid, { text: "🤖 Memproses Grok..." }, { quoted: m });

    try {
        const apiUrl = `https://api.nekolabs.web.id/text.gen/grok/3-jailbreak/v2?text=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        const resultText = data?.result;
        if (!resultText || typeof resultText !== "string") {
            return await sock.sendMessage(jid, { text: "❌ Gagal mendapatkan jawaban dari Grok." }, { quoted: m });
        }

        await sock.sendMessage(jid, { text: `Grok: ${resultText}` }, { quoted: m });

    } catch (err) {
        console.error(err);
        await sock.sendMessage(jid, { text: `❌ Terjadi kesalahan: ${err.message || err}` }, { quoted: m });
    }
};

grokHandler.help = ["grok"];
grokHandler.tags = ["ai"];
grokHandler.command = /^grok$/i;

export default grokHandler;