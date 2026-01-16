const setNameGcHandler = async (m, { sock, reply, text, from }) => {
    // Validasi: Harus ada text
    if (!text || text.trim() === '') {
        return reply(`❌ Nama grup tidak boleh kosong!\n\n📌 Contoh penggunaan:\n${global.prefix}setnamegc Grup Keren 2025`);
    }

    try {
        // Validasi panjang nama (WhatsApp limit: 1-25 karakter)
        const newName = text.trim();
        if (newName.length > 25) {
            return reply(`❌ Nama grup terlalu panjang!\n\n📏 Maksimal 25 karakter.\n💡 Nama Anda: ${newName.length} karakter`);
        }

        // Ambil metadata grup untuk dapatkan nama lama
        const metadata = await sock.groupMetadata(from);
        const oldName = metadata.subject;

        // Ubah nama grup
        await sock.groupUpdateSubject(from, newName);

        // Kirim konfirmasi
        await reply(`✅ *Nama grup berhasil diubah!*\n\n📝 Nama lama: ${oldName}\n✨ Nama baru: ${newName}`);

    } catch (error) {
        console.error('[SETNAMEGC ERROR]:', error);
        
        // Handle error spesifik
        if (error.message?.includes('not-admin')) {
            return reply('❌ Bot bukan admin! Jadikan bot admin terlebih dahulu.');
        } else if (error.message?.includes('forbidden')) {
            return reply('❌ Bot tidak memiliki izin untuk mengubah nama grup.');
        } else {
            return reply('❌ Terjadi kesalahan saat mengubah nama grup!\n\n🔍 Error: ' + (error.message || 'Unknown error'));
        }
    }
};

setNameGcHandler.help = ["setnamegc"];
setNameGcHandler.tags = ["group"];
setNameGcHandler.command = /^(setnamegc|setname|setnama|setsubject)$/i;
setNameGcHandler.group = true;      // ✅ Handler.js cek ini (baris 74)
setNameGcHandler.admin = false;      // ✅ Handler.js cek ini (baris 76-80)
setNameGcHandler.botAdmin = false;   // ✅ Handler.js cek ini (baris 82-87)

export default setNameGcHandler;