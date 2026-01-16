const handler = async (m, { sock, sender, isOwner }) => {
    // Mengambil nomor murni tanpa device ID dan tanpa @s.whatsapp.net
    const senderNumber = sender.split('@')[0].split(':')[0].replace(/\D/g, '');
    
    let text = `*「 CHECK USER ID 」*\n\n`;
    text += `◦ *ID:* ${senderNumber}\n`;
    text += `◦ *Status:* ${isOwner ? 'Owner' : 'User'}\n\n`;
    text += `_Gunakan ID di atas untuk didaftarkan di settings.js jika status masih User._`;

    await sock.sendMessage(m.key.remoteJid, { text: text }, { quoted: m });
};

handler.help = ['cekid'];
handler.tags = ['tools'];
handler.command = /^(cekid|myid)$/i;

export default handler;