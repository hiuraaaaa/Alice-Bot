const aliceHandler = async (m, { sock, reply, text, from }) => {
    if (!text || text.trim() === '') {
        return reply(`❗ Nama grup tidak boleh kosong\nContoh: ${global.prefix}setnamegc Grup Keren 2025`);
    }

    try {
        const newName = text.trim();
        if (newName.length > 25) {
            return reply(`❌ Nama grup terlalu panjang!\n\n📏 Maksimal: 25 karakter\n💡 Nama Anda: ${newName.length} karakter`);
        }

        const metadata = await sock.groupMetadata(from);
        const oldName = metadata.subject;

        await sock.groupUpdateSubject(from, newName);

        await reply(`✅ *Nama grup berhasil diubah!*\n\n📝 Nama lama: ${oldName}\n✨ Nama baru: ${newName}`);

        return true;
    } catch (err) {
        console.error(err);
        
        if (err.message?.includes('not-admin')) {
            return reply(global.mess.botAdmin);
        } else if (err.message?.includes('forbidden')) {
            return reply('❌ Bot tidak memiliki izin untuk mengubah nama grup.');
        } else {
            return reply('❌ Terjadi kesalahan saat mengubah nama grup.');
        }
    }
};

aliceHandler.help = ["setnamegc", "setname"];
aliceHandler.tags = ["group"];
aliceHandler.command = /^(setnamegc|setname|setnama|setsubject)$/i;
aliceHandler.group = true;
aliceHandler.admin = false;
aliceHandler.botAdmin = true;
aliceHandler.limit = false;

export default aliceHandler;
