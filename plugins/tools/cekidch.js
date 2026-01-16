const handler = async (m, { sock, text, reply }) => {
    if (!text) return reply(`Kirim link channel WhatsApp untuk cek ID-nya.\nContoh: ${global.prefix}cekidch https://whatsapp.com/channel/xxxx`);

    // Ekstrak code dari link channel
    const inviteCode = text.split('channel/')[1]?.split('/')[0];
    if (!inviteCode) return reply('❌ Link channel tidak valid!');

    try {
        await reply(global.mess.wait);
        
        // Menggunakan fungsi bawaan Baileys untuk mendapatkan metadata newsletter
        const metadata = await sock.newsletterMetadata('invite', inviteCode);
        
        if (metadata && metadata.id) {
            const resultText = `*NEWSLETTER INFO*
            
📌 *ID:* ${metadata.id}
📛 *Nama:* ${metadata.name}
👥 *Subscribers:* ${metadata.subscribers || 'Tidak diketahui'}
📝 *Deskripsi:* ${metadata.description || '-'}
🔗 *Link:* https://whatsapp.com/channel/${inviteCode}`;

            await reply(resultText);
        } else {
            await reply('❌ Gagal mendapatkan metadata channel. Pastikan link benar.');
        }
    } catch (err) {
        console.error(err);
        await reply('❌ Terjadi kesalahan. Pastikan bot memiliki akses atau link channel valid.');
    }
};

handler.help = ["cekidch"];
handler.tags = ["tools"];
handler.command = /^(cekidch|idch)$/i;

export default handler;