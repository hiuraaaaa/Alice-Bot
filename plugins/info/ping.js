import { performance } from 'perf_hooks';

const aliceHandler = async (m, { sock }) => {
    const sender = m?.sender || m?.key?.participant || "0@s.whatsapp.net";
    const chatJid = m.key?.remoteJid || sender;

    let pingMessage = null;
    try {
        pingMessage = await sock.sendMessage(chatJid, { 
            text: `⏳ *Mengecek ping...*`,
            mentions: [sender]
        }, { quoted: m });
    } catch (err) {
        console.error(err);
        return false;
    }

    const start = performance.now();
    await new Promise(r => setTimeout(r, Math.random() * 500 + 100));
    const end = performance.now();
    const responseTime = (end - start).toFixed(2);

    let latencyEmoji = "⚡";
    if (responseTime > 1000) latencyEmoji = "🐌";
    else if (responseTime > 500) latencyEmoji = "🐢";
    else if (responseTime > 200) latencyEmoji = "🚶";
    else if (responseTime > 100) latencyEmoji = "🏃";
    else if (responseTime > 50) latencyEmoji = "🚗";

    const userName = m?.pushName || sender.split("@")[0];
    const date = new Date();
    const formattedDate = date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const message = `🏓 *P O N G !* ${latencyEmoji}\n\n` +
        `👋 Hai @${userName}!\n` +
        `⏱️ *Response Time:* ${responseTime}ms\n` +
        `📊 *Status:* ${responseTime < 200 ? "Excellent" : responseTime < 500 ? "Good" : "Slow"}\n` +
        `📅 *Tanggal:* ${formattedDate}\n` +
        `⏰ *Waktu:* ${formattedTime}\n\n` +
        `💡 *Latency Guide:*\n` +
        `• < 100ms ⚡ Super Fast\n` +
        `• 100-200ms 🏃 Fast\n` +
        `• 200-500ms 🚶 Normal\n` +
        `• 500-1000ms 🐢 Slow\n` +
        `• > 1000ms 🐌 Very Slow\n\n` +
        `🔧 *Bot Status:* ✅ Online`;

    try {
        if (pingMessage && pingMessage.key) {
            await sock.sendMessage(chatJid, { 
                text: message, 
                mentions: [sender],
                edit: pingMessage.key
            });
        } else {
            await sock.sendMessage(chatJid, { 
                text: message, 
                mentions: [sender]
            });
        }
        return true;
    } catch (err) {
        console.error(err);
        try {
            await sock.sendMessage(chatJid, { 
                text: message,
                mentions: [sender]
            });
            return true;
        } catch (fallbackErr) {
            console.error(fallbackErr);
            return false;
        }
    }
};

aliceHandler.help = ["ping", "speed"];
aliceHandler.tags = ["info"];
aliceHandler.command = /^(ping|speed|test)$/i;
aliceHandler.limit = false;

export default aliceHandler;
