const sendpesanHandler = async (m, { sock, text, isOwner }) => {
    // ✅ Owner only
    if (!isOwner) {
        return await sock.sendMessage(m.key.remoteJid, {
            text: '❌ *Perintah khusus Owner!*\n\n🔒 Anda tidak memiliki akses ke fitur ini.'
        }, { quoted: m });
    }

    // Validasi format input
    if (!text || !text.includes('|')) {
        return await sock.sendMessage(m.key.remoteJid, {
            text: `❌ *Format salah!*\n\n📝 *Cara Pakai:*\n${global.prefix[0]}sendpesan <nomor>|<pesan>\n\n💡 *Contoh:*\n${global.prefix[0]}sendpesan 628123456789|Halo, ini pesan dari bot\n${global.prefix[0]}sendpesan 628123456789|Selamat pagi!\n\n⚠️ *Note:* Nomor harus pakai 62 (tanpa +)`
        }, { quoted: m });
    }

    try {
        // Parse nomor dan pesan
        const [nomor, ...pesanArray] = text.split('|');
        const pesan = pesanArray.join('|').trim();
        const cleanNumber = nomor.trim().replace(/[^0-9]/g, '');

        // Validasi
        if (!cleanNumber) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: '❌ *Nomor tidak valid!*\n\nPastikan nomor hanya berisi angka.'
            }, { quoted: m });
        }

        if (!pesan) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: '❌ *Pesan tidak boleh kosong!*'
            }, { quoted: m });
        }

        // Loading message
        const loadingMsg = await sock.sendMessage(m.key.remoteJid, {
            text: `_⏳ Mengirim pesan..._\n_📱 Target: ${cleanNumber}_`
        }, { quoted: m });

        // Format JID WhatsApp
        const targetJid = `${cleanNumber}@s.whatsapp.net`;

        // Cek apakah nomor terdaftar di WhatsApp
        const [exists] = await sock.onWhatsApp(cleanNumber);
        
        if (!exists || !exists.exists) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: `❌ *Nomor tidak terdaftar di WhatsApp!*\n\n📱 Nomor: ${cleanNumber}\n\n💡 Pastikan nomor aktif dan terdaftar di WhatsApp.`,
                edit: loadingMsg.key
            });
        }

        // Kirim pesan
        await sock.sendMessage(targetJid, {
            text: pesan
        });

        // Success message
        return await sock.sendMessage(m.key.remoteJid, {
            text: `✅ *Pesan berhasil dikirim!*\n\n📱 *Target:* ${cleanNumber}\n📝 *Pesan:* ${pesan.substring(0, 100)}${pesan.length > 100 ? '...' : ''}\n⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}`,
            edit: loadingMsg.key
        });

    } catch (error) {
        console.error('[SENDPESAN] Error:', error);
        
        return await sock.sendMessage(m.key.remoteJid, {
            text: `❌ *Gagal mengirim pesan!*\n\n⚠️ *Error:* ${error.message}\n\n💡 *Kemungkinan penyebab:*\n• Nomor diblokir\n• Bot sedang dibatasi WhatsApp\n• Nomor tidak valid\n• Koneksi bermasalah`
        }, { quoted: m });
    }
};

sendpesanHandler.help = ['sendpesan'];
sendpesanHandler.tags = ['owner'];
sendpesanHandler.command = /^(sendpesan|sendmsg|kirimpesan)$/i;
sendpesanHandler.owner = true;

export default sendpesanHandler;