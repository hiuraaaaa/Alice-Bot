import fetch from 'node-fetch';

const handler = async (m, { sock, text, command }) => {
    const chatJid = m.key.remoteJid;
    const prefix = global.prefix;

    // 1. Validasi input
    if (!text) {
        return await sock.sendMessage(chatJid, { 
            text: `Mau tanya apa? Contoh:\n*${prefix + command}* jelaskan apa itu GPU` 
        }, { quoted: m });
    }

    // 2. Reaksi loading
    await sock.sendMessage(chatJid, { react: { text: "⏳", key: m.key } });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                // API Key langsung, sesuai permintaan kamu
                "Authorization": "Bearer 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",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/your-repo",
                "X-Title": "Hiura-Bot"
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3-nano-30b-a3b:free",
                messages: [
                    { role: "user", content: text }
                ]
            })
        });

        const data = await response.json();

        // 3. Cek hasil
        if (data?.choices?.[0]?.message?.content) {
            const hasil = data.choices[0].message.content.trim();

            await sock.sendMessage(chatJid, { 
                text: `⚡ *NVIDIA Nemotron-3 Nano 30B A3B (FREE)*\n\n${hasil}` 
            }, { quoted: m });
        } else {
            throw new Error(data?.error?.message || "Gagal mendapatkan respon dari AI.");
        }

    } catch (err) {
        console.error("[NEMOTRON ERROR]", err);
        await sock.sendMessage(chatJid, { 
            text: `❌ *Error:* ${err.message}` 
        }, { quoted: m });
    }
};

handler.help = ["nemotron", "nemo"];
handler.tags = ["ai"];
handler.command = /^(nemotron|nemo)$/i;

export default handler;