// file: plugins/ai/gemini.js
import fetch from "node-fetch";

const geminiHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    if (!text) {
        return await sock.sendMessage(jid, { text: "Gunakan: .gemini <pertanyaan>" }, { quoted: m });
    }

    await sock.sendMessage(jid, { text: "🤖 Memproses AI..." }, { quoted: m });

    try {
        const apiUrl = `https://api.nekolabs.web.id/text.gen/gemini/realtime?text=${encodeURIComponent(text)}&systemPrompt=Sistem+promt&sessionId=123`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.success && data.result?.text) {
            await sock.sendMessage(jid, { text: `💬 Gemini: ${data.result.text}` }, { quoted: m });
        } else {
            await sock.sendMessage(jid, { text: "❌ Gagal mendapatkan jawaban dari AI." }, { quoted: m });
        }
    } catch (err) {
        console.error(err);
        await sock.sendMessage(jid, { text: `❌ Terjadi kesalahan: ${err.message}` }, { quoted: m });
    }
};

geminiHandler.help = ["gemini"];
geminiHandler.tags = ["ai"];
geminiHandler.command = /^gemini$/i;

export default geminiHandler;