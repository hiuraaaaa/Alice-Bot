import didyoumean from 'didyoumean';
import similarity from 'similarity';

let handler = m => m;

handler.before = async function (m, { sock, isCmd, body }) {
    // Hanya jalankan jika pesan diawali prefix dan bukan dari bot sendiri
    if (!isCmd || m.key.fromMe) return;

    const prefix = global.prefix || '.';
    // Ambil teks setelah prefix (misal: .mennu -> mennu)
    const noPrefix = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
    
    // Ambil semua daftar command dari plugins yang terdaftar di global.plugins
    let alias = [];
    for (const key in global.plugins) {
        const plugin = global.plugins[key];
        if (plugin.help) {
            // Masukkan semua help ke dalam array alias
            if (Array.isArray(plugin.help)) {
                alias.push(...plugin.help);
            } else {
                alias.push(plugin.help);
            }
        }
    }

    // Jika command sudah benar (ada di daftar), tidak perlu jalankan didyoumean
    if (alias.includes(noPrefix)) return;

    // Cari kemiripan kata
    let mean = didyoumean(noPrefix, alias);
    if (!mean) return;

    let sim = similarity(noPrefix, mean);
    let percent = parseInt(sim * 100);

    // Hanya tampilkan jika kemiripan di atas 50% agar tidak mengganggu
    if (percent < 50) return;

    let text = `Halo *${m.pushName || 'Kak'}* 👋\n\nApakah Anda sedang mencari perintah berikut?\n\n◦ *Command:* ${prefix}${mean}\n◦ *Kemiripan:* ${percent}%\n\n_Ketik ulang perintah dengan benar ya!_`;

    // Mengirim pesan dengan gaya Neura
    await sock.sendMessage(m.key.remoteJid, {
        text: text,
        contextInfo: {
            mentionedJid: [m.sender],
            externalAdReply: {
                title: 'DID YOU MEAN?',
                body: global.botName,
                thumbnailUrl: global.bannerUrl,
                sourceUrl: '',
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m });
};

export default handler;