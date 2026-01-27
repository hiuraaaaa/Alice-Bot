import fetch from 'node-fetch';

const handler = async (m, { sock, text, command }) => {
    const chatJid = m.key.remoteJid;
    const prefix = global.prefix;

    // Validasi input
    if (!text) {
        return await sock.sendMessage(chatJid, { 
            text: `Mau tanya apa? Contoh:\n*${prefix + command}* cara buat kopi susu` 
        }, { quoted: m });
    }

    // Reaksi loading
    await sock.sendMessage(chatJid, { react: { text: "⏳", key: m.key } });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer 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",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/your-repo",
                "X-Title": "Hiura-Bot"
            },
            body: JSON.stringify({
                "model": "meta-llama/llama-3.3-70b-instruct:free",
                "messages": [
                    { "role": "user", "content": text }
                ]
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            const hasilText = data.choices[0].message.content.trim();

            await sock.sendMessage(chatJid, { 
                text: `🦙 *LLAMA 3.3 70B (FREE)*\n\n${hasilText}` 
            }, { quoted: m });

        } else {
            const errorMsg = data.error ? data.error.message : "Gagal mendapatkan respon.";
            throw new Error(errorMsg);
        }

    } catch (err) {
        console.error("[LLAMA ERROR]", err);
        await sock.sendMessage(chatJid, { 
            text: `❌ *Error:* ${err.message}` 
        }, { quoted: m });
    }
};

handler.help = ["llama", "llm"];
handler.tags = ["ai"];
handler.command = /^(llama|llm)$/i;

export default handler;