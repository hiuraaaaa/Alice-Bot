// file: plugins/search/pinterest.js
import fetch from "node-fetch";

const pinterestHandler = async (m, { sock, text, args }) => {
    const jid = m.key.remoteJid;

    if (!text) {
        return await sock.sendMessage(jid, { 
            text: `❗ Masukkan kata kunci dan jumlah (opsional).\nContoh:\n.pin hutao (kirim 1 acak)\n.pin hutao 5 (kirim 5 gambar)` 
        }, { quoted: m });
    }

    // Mengambil angka di bagian akhir argumen jika ada
    let count = 1;
    let query = text;
    
    if (args.length > 1 && !isNaN(args[args.length - 1])) {
        count = parseInt(args.pop());
        query = args.join(" ");
    }

    // Batasi maksimal agar tidak spam (misal max 10)
    if (count > 10) count = 10;

    try {
        const apiUrl = `https://api.nekolabs.web.id/discovery/pinterest/search?q=${encodeURIComponent(query)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data.success || !data.result || data.result.length === 0) {
            return await sock.sendMessage(jid, { text: "❌ Gambar tidak ditemukan." }, { quoted: m });
        }

        // Jika minta 1, ambil secara acak (random) dari hasil agar tidak bosan
        // Jika minta lebih, ambil secara berurutan sesuai jumlah
        let results = [];
        if (count === 1) {
            results = [data.result[Math.floor(Math.random() * data.result.length)]];
        } else {
            results = data.result.slice(0, count);
        }

        for (let pin of results) {
            await sock.sendMessage(jid, { 
                image: { url: pin.imageUrl },
                caption: `📌 *Query:* ${query}\n👤 *Author:* ${pin.author.fullname}\n🔗 *Source:* ${pin.url}`
            }, { quoted: count === 1 ? m : null }); // Hanya reply jika cuma 1 gambar agar chat rapi
            
            // Delay jika mengirim banyak gambar
            if (results.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

    } catch (e) {
        console.error("[PINTEREST ERROR]", e);
        await sock.sendMessage(jid, { text: "❌ Terjadi kesalahan teknis." }, { quoted: m });
    }
};

pinterestHandler.help = ['pin <query> <jumlah>'];
pinterestHandler.tags = ['search'];
pinterestHandler.command = /^(pinterest|pin)$/i;

export default pinterestHandler;