import fs from "fs";
import path from "path";

const menuHandler = async (m, { sock, text, sender }) => {
    const userName = m.pushName || sender.split("@")[0];
    
    if (!text) {
        let menuText = `👋 Hai, *${userName}*!\n\n`;
        menuText += `Selamat datang di *Alice Bot RPG*\n\n`;
        
        menuText += `┌ *🎮 RPG GAME*\n`;
        menuText += `├ .register, .profile, .lb\n`;
        menuText += `├ .adventure, .hunt, .dungeon\n`;
        menuText += `├ .mining, .fishing, .work, .daily\n`;
        menuText += `├ .inventory, .equip, .use, .heal\n`;
        menuText += `└ .shop, .buy, .craft\n\n`;
        
        menuText += `┌ *👥 GROUP*\n`;
        menuText += `├ .groupinfo, .kick, .add\n`;
        menuText += `└ .promote, .demote, .antilink\n\n`;
        
        menuText += `┌ *🤖 AI & TOOLS*\n`;
        menuText += `├ .ai, .chatgpt, .imagine\n`;
        menuText += `└ .sticker, .toimg, .play\n\n`;
        
        menuText += `╰━━━━━━━━━━━━━━━━━━╯\n`;
        menuText += `_Ketik .menu <kategori> untuk detail_`;

        return await sock.sendMessage(m.key.remoteJid, { text: menuText }, { quoted: m });
    }

    // Detail category logic can be added here if needed
    m.reply(`Fitur detail kategori sedang dalam pengembangan. Gunakan menu utama saja untuk saat ini.`);
};

menuHandler.help = ["menu"];
menuHandler.tags = ["main"];
menuHandler.command = /^(menu|help)$/i;

export default menuHandler;
