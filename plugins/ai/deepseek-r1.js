import fetch from 'node-fetch';

const handler = async (m, { sock, text, command }) => {
    const chatJid = m.key.remoteJid;
    const prefix = global.prefix;

    // 1. Validasi Input
    if (!text) {
        return await sock.sendMessage(chatJid, { 
            text: `Mau tanya apa? Contoh:\n*${prefix + command}* cara membuat kopi susu` 
        }, { quoted: m });
    }

    // 2. Kirim reaksi sedang diproses
    await sock.sendMessage(chatJid, { react: { text: "⏳", key: m.key } });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                // API Key yang baru saja kamu dapatkan
                "Authorization": "Bearer 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", 
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/your-repo", // Opsional, bisa bebas
                "X-Title": "Alice-Bot" // Opsional
            },
            body: JSON.stringify({
                "model": "deepseek/deepseek-r1-0528:free",
                "messages": [
                    { "role": "user", "content": text }
                ]
            })
        });

        const data = await response.json();
        
        // 3. Ambil hasil teks dari response AI
        if (data.choices && data.choices[0]) {
            const hasilText = data.choices[0].message.content;
            
            await sock.sendMessage(chatJid, { 
                text: `🤖 *DEEPSEEK R1 (Free)*\n\n${hasilText.trim()}` 
            }, { quoted: m });
        } else {
            // Jika ada error dari API (seperti limit habis)
            const errorMsg = data.error ? data.error.message : "Gagal mendapatkan respon.";
            throw new Error(errorMsg);
        }

    } catch (err) {
        console.error("[DEEPSEEK ERROR]", err);
        await sock.sendMessage(chatJid, { 
            text: `❌ *Error:* ${err.message}` 
        }, { quoted: m });
    }
};

handler.help = ["deepseek", "r1"];
handler.tags = ["ai"];
handler.command = /^(deepseek|ds|r1)$/i;

export default handler;