const modeHandler = async (m, { args, reply }) => {
    if (!args[0]) {
        // Tampilkan status mode saat ini jika tanpa argumen
        const currentMode = global.isPublic ? 'PUBLIC ✅' : 'SELF 🔒';
        return reply(`📊 *Status Mode Bot*\n\nMode saat ini: *${currentMode}*\n\n💡 Gunakan:\n• ${global.prefix}mode public - Mode publik\n• ${global.prefix}mode self - Mode owner only`);
    }

    const choice = args[0].toLowerCase();
    
    if (choice === 'public') {
        if (global.isPublic) {
            return reply('ℹ️ Bot sudah dalam mode *PUBLIC*.');
        }
        global.isPublic = true;
        await reply('✅ Bot sekarang dalam mode *PUBLIC*.\n\n👥 Semua orang bisa menggunakan bot.');
    } else if (choice === 'self') {
        if (!global.isPublic) {
            return reply('ℹ️ Bot sudah dalam mode *SELF*.');
        }
        global.isPublic = false;
        await reply('🔒 Bot sekarang dalam mode *SELF*.\n\n👤 Hanya Owner yang bisa menggunakan bot.');
    } else {
        await reply(`❌ Pilihan tidak valid!\n\n💡 Gunakan:\n• ${global.prefix}mode public\n• ${global.prefix}mode self`);
    }
};

modeHandler.help = ["mode"];
modeHandler.tags = ["owner"];
modeHandler.command = /^(mode|setmode)$/i;
modeHandler.owner = true; // ⚠️ INI PENTING! Hanya owner yang bisa akses

export default modeHandler;