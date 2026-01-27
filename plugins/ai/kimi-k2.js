import fetch from 'node-fetch';

const handler = async (m, { sock, text, command }) => {
    const chatJid = m.key.remoteJid;
    const prefix = global.prefix;

    if (!text) {
        return await sock.sendMessage(chatJid, {
            text: `Mau tanya apa? Contoh:\n*${prefix + command}* jelaskan apa itu vite.js`
        }, { quoted: m });
    }

    // Kirim reaksi loading
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
                model: "moonshotai/kimi-k2:free",
                messages: [
                    { role: "user", content: text }
                ]
            })
        });

        const data = await response.json();

        if (data?.choices?.[0]?.message?.content) {
            const hasil = data.choices[0].message.content.trim();
            await sock.sendMessage(chatJid, {
                text: `🤖 *KIMI K2 (FREE)*\n\n${hasil}`
            }, { quoted: m });
        } else {
            const errorMsg = data?.error?.message || "Gagal mendapatkan respon AI.";
            throw new Error(errorMsg);
        }
    } catch (err) {
        console.error("[KIMI K2 ERROR]", err);
        await sock.sendMessage(chatJid, {
            text: `❌ *Error:* ${err.message}`
        }, { quoted: m });
    }
};

handler.help = ["kimi", "k2"];
handler.tags = ["ai"];
handler.command = /^(kimi|k2)$/i;

export default handler;