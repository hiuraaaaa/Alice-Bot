// file: plugins/ai/brave.js
import fetch from "node-fetch";

const braveHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    if (!text) {
        await sock.sendMessage(jid, { text: "Gunakan: .brave <pertanyaan>" }, { quoted: m });
        return;
    }

    // Pesan loading
    let msgLoading;
    try {
        msgLoading = await sock.sendMessage(
            jid,
            { text: "🔎 Brave AI sedang mencari jawaban..." },
            { quoted: m }
        );
    } catch (e) {
        console.error("Gagal kirim pesan loading:", e);
    }

    try {
        const url = `https://api.nekolabs.web.id/text.gen/brave-chat?text=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();

        // Hapus loading
        if (msgLoading) await sock.sendMessage(jid, { delete: msgLoading.key });

        if (!data.success) {
            await sock.sendMessage(
                jid,
                { text: "❌ Gagal mengambil data dari Brave AI." },
                { quoted: m }
            );
            return;
        }

        const answer = data?.result?.response || "Tidak ada jawaban.";

        const finalText = `🦊 *Brave Chat AI:*\n${answer.trim()}`;

        if (finalText.length > 4000) {
            await sock.sendMessage(
                jid,
                {
                    text: finalText.slice(0, 4000) +
                        "\n\n⚠️ Jawaban panjang, sebagian dipotong."
                },
                { quoted: m }
            );
        } else {
            await sock.sendMessage(jid, { text: finalText }, { quoted: m });
        }

    } catch (err) {
        console.error("Error braveHandler:", err);

        // Hapus pesan loading jika error
        if (msgLoading) {
            try {
                await sock.sendMessage(jid, { delete: msgLoading.key });
            } catch {}
        }

        await sock.sendMessage(
            jid,
            { text: `❌ Terjadi kesalahan: ${err.message}` },
            { quoted: m }
        );
    }
};

braveHandler.help = ["brave"];
braveHandler.tags = ["ai"];
braveHandler.command = /^brave$/i;

export default braveHandler;