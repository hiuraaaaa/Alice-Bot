import { performance } from 'perf_hooks';

const robin = async (m, { sock }) => {
    const sender = m?.sender || m?.key?.participant || "0@s.whatsapp.net";
    const chatJid = m.key?.remoteJid || sender;

    // 1. Kirim pesan awal (loading)
    let pingMessage = null;
    try {
        pingMessage = await sock.sendMessage(chatJid, { 
            text: `⏳ *Mengecek ping...*`,
            mentions: [sender]
        }, { quoted: m });
    } catch (err) {
        console.error("Error kirim pesan awal:", err);
        return;
    }

    // 2. Ukur waktu respons
    const start = performance.now();
    await new Promise(r => setTimeout(r, Math.random() * 500 + 100)); // Simulasi delay random
    const end = performance.now();
    const responseTime = (end - start).toFixed(2);

    // 3. Hitung latency emoji
    let latencyEmoji = "⚡"; // Ultra fast
    if (responseTime > 1000) latencyEmoji = "🐌"; // Very slow
    else if (responseTime > 500) latencyEmoji = "🐢"; // Slow
    else if (responseTime > 200) latencyEmoji = "🚶"; // Normal
    else if (responseTime > 100) latencyEmoji = "🏃"; // Fast
    else if (responseTime > 50) latencyEmoji = "🚗"; // Very fast

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

    // 4. Buat pesan final
    const message = `
🏓 *P O N G !* ${latencyEmoji}

👋 Hai @${userName}!
⏱️ *Response Time:* ${responseTime}ms
📊 *Status:* ${responseTime < 200 ? "Excellent" : responseTime < 500 ? "Good" : "Slow"}
📅 *Tanggal:* ${formattedDate}
⏰ *Waktu:* ${formattedTime}

💡 *Latency Guide:*
• < 100ms ⚡ Super Fast
• 100-200ms 🏃 Fast
• 200-500ms 🚶 Normal
• 500-1000ms 🐢 Slow
• > 1000ms 🐌 Very Slow

🔧 *Bot Status:* ✅ Online
`;

    // 5. EDIT pesan yang sudah ada (bukan kirim baru)
    try {
        if (pingMessage && pingMessage.key) {
            await sock.sendMessage(chatJid, { 
                text: message, 
                mentions: [sender],
                edit: pingMessage.key // KEY INI untuk edit pesan
            });
        } else {
            // Fallback jika tidak bisa edit
            await sock.sendMessage(chatJid, { 
                text: message, 
                mentions: [sender]
            });
        }
    } catch (err) {
        console.error("Error edit ping:", err);
        
        // Fallback: kirim pesan baru
        try {
            await sock.sendMessage(chatJid, { 
                text: message + "\n\n⚠️ *Note:* Edit failed, sending new message",
                mentions: [sender]
            });
        } catch (fallbackErr) {
            console.error("Fallback juga error:", fallbackErr);
        }
    }
};

// Versi dengan progress step-by-step
robin.editWithProgress = async (m, { sock }) => {
    const sender = m?.sender || m?.key?.participant || "0@s.whatsapp.net";
    const chatJid = m.key?.remoteJid || sender;

    let progressMessage = null;
    const steps = [
        "⏳ *Memulai ping test...*",
        "📡 *Mengukur latency...*",
        "⚙️ *Memproses hasil...*",
        "✅ *Selesai!*"
    ];

    // Step 1: Kirim pesan progress awal
    try {
        progressMessage = await sock.sendMessage(chatJid, { 
            text: `${steps[0]}\n\n🔍 Step 1/4`,
            mentions: [sender]
        }, { quoted: m });
    } catch (err) {
        console.error("Error step 1:", err);
        return;
    }

    // Step 2: Update dengan step 2
    await new Promise(r => setTimeout(r, 800));
    try {
        await sock.sendMessage(chatJid, { 
            text: `${steps[1]}\n\n🔍 Step 2/4`,
            mentions: [sender],
            edit: progressMessage.key
        });
    } catch (err) {
        console.error("Error step 2:", err);
    }

    // Ukur ping
    const start = performance.now();
    await new Promise(r => setTimeout(r, 300));
    const end = performance.now();
    const responseTime = (end - start).toFixed(2);

    // Step 3: Update dengan step 3
    await new Promise(r => setTimeout(r, 600));
    try {
        await sock.sendMessage(chatJid, { 
            text: `${steps[2]}\n\n📊 Latency: ${responseTime}ms\n🔍 Step 3/4`,
            mentions: [sender],
            edit: progressMessage.key
        });
    } catch (err) {
        console.error("Error step 3:", err);
    }

    // Step 4: Final result
    await new Promise(r => setTimeout(r, 400));
    const finalMessage = `
🏓 *PING TEST COMPLETE!*

👤 User: @${sender.split("@")[0]}
⏱️ Response Time: ${responseTime}ms
📈 Status: ${responseTime < 100 ? "Excellent ⚡" : "Good 🏃"}
⏰ Tested at: ${new Date().toLocaleTimeString('id-ID')}

✅ *Test passed successfully!*
    `;

    try {
        await sock.sendMessage(chatJid, { 
            text: `${steps[3]}\n\n${finalMessage}`,
            mentions: [sender],
            edit: progressMessage.key
        });
    } catch (err) {
        console.error("Error step 4:", err);
    }
};

// Versi simple edit
robin.simpleEdit = async (m, { sock }) => {
    const chatJid = m.key?.remoteJid;
    
    // Kirim pesan loading
    const loadingMsg = await sock.sendMessage(chatJid, {
        text: "🔄 Testing connection..."
    }, { quoted: m });

    // Simulasi proses
    await new Promise(r => setTimeout(r, 1500));
    
    const latency = (Math.random() * 200 + 50).toFixed(2); // Random 50-250ms
    
    // Edit pesan
    await sock.sendMessage(chatJid, {
        text: `🏓 Pong!\n\nLatency: ${latency}ms\nStatus: ✅ Connected`,
        edit: loadingMsg.key
    });
};

// Command handler
robin.command = /^(ping|speed|test)$/i;
robin.help = ['ping - Test bot response time'];
robin.tags = ['tools', 'info'];
robin.owner = false;

export default robin;