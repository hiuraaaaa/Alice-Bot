import fetch from "node-fetch";

let gptHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;
    if (!text) return await sock.sendMessage(jid, { text: "Gunakan: .gpt <teks>" }, { quoted: m });

    await sock.sendMessage(jid, { text: "🤖 Memproses AI..." }, { quoted: m });

    try {
        const apiUrl = `https://api.nekolabs.web.id/text.gen/gpt/5-nano?text=${encodeURIComponent(text)}&systemPrompt=Sistem+promt&sessionId=neko`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.success && data.result) {
            await sock.sendMessage(jid, { text: `💬 GPT: ${data.result}` }, { quoted: m });
        } else {
            await sock.sendMessage(jid, { text: "❌ Gagal mendapatkan jawaban dari AI." }, { quoted: m });
        }
    } catch (err) {
        console.error(err);
        await sock.sendMessage(jid, { text: `❌ Terjadi kesalahan: ${err.message}` }, { quoted: m });
    }
};

gptHandler.help = ["gpt"];
gptHandler.tags = ["ai"];
gptHandler.command = /^gpt$/i;

export default gptHandler;