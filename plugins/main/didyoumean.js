import didyoumean from 'didyoumean';
import similarity from 'similarity';

const handler = async (msg, { sock, body, sender, from }) => {
    // Hanya jalankan jika pesan diawali prefix dan bukan dari bot sendiri
    if (msg.key.fromMe) return;
    
    const prefix = global.prefix || '.';
    
    // Cek apakah ada prefix
    if (!body.startsWith(prefix)) return;
    
    // Ambil teks setelah prefix
    const noPrefix = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
    if (!noPrefix) return;
    
    // Ambil semua daftar command dari plugins
    let alias = [];
    for (const key in global.plugins) {
        const plugin = global.plugins[key];
        if (plugin.help) {
            if (Array.isArray(plugin.help)) {
                alias.push(...plugin.help);
            } else {
                alias.push(plugin.help);
            }
        }
    }

    // Jika command sudah benar, tidak perlu jalankan didyoumean
    if (alias.includes(noPrefix)) return;

    // Cari kemiripan kata
    let mean = didyoumean(noPrefix, alias);
    if (!mean) return;

    let sim = similarity(noPrefix, mean);
    let percent = parseInt(sim * 100);

    // Hanya tampilkan jika kemiripan di atas 50%
    if (percent < 50) return;

    let text = `Halo *${msg.pushName || 'Kak'}* 👋\n\nApakah Anda sedang mencari perintah berikut?\n\n◦ *Command:* ${prefix}${mean}\n◦ *Kemiripan:* ${percent}%\n\n_Ketik ulang perintah dengan benar ya!_`;

    await sock.sendMessage(from, {
        text: text,
        contextInfo: {
            mentionedJid: [sender],
            externalAdReply: {
                title: 'DID YOU MEAN?',
                body: global.botName,
                thumbnailUrl: global.bannerUrl,
                sourceUrl: '',
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: msg });
};

// ✅ Ubah jadi all function
handler.all = handler;

export default handler;