// file: plugins/ai/copilot.js
import fetch from "node-fetch";

const copilotHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    if (!text) {
        return await sock.sendMessage(jid, { text: "Gunakan: .copilot <pertanyaan>" }, { quoted: m });
    }

    // Memberikan reaksi atau pesan tunggu
    await sock.sendMessage(jid, { text: "🤖 Copilot sedang berpikir..." }, { quoted: m });

    try {
        // Menggunakan endpoint Copilot sesuai permintaan Anda
        const apiUrl = `https://api.nekolabs.web.id/text.gen/copilot?text=${encodeURIComponent(text)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data.success && data.result?.text) {
            // Mengirimkan hasil teks dari Copilot
            await sock.sendMessage(jid, { 
                text: data.result.text 
            }, { quoted: m });
        } else {
            await sock.sendMessage(jid, { text: "❌ Gagal mendapatkan jawaban dari Copilot." }, { quoted: m });
        }
    } catch (err) {
        console.error(err);
        await sock.sendMessage(jid, { text: `❌ Terjadi kesalahan: ${err.message}` }, { quoted: m });
    }
};

copilotHandler.help = ["copilot"];
copilotHandler.tags = ["ai"];
copilotHandler.command = /^(copilot|cp)$/i; // Bisa dipanggil dengan .copilot atau .cp

export default copilotHandler;