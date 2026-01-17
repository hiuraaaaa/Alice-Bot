import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const menuHandler = async (m, { sock, text, sender }) => {
    const baseDir = path.join(process.cwd(), "plugins");
    const categories = fs.readdirSync(baseDir).filter(d => fs.statSync(path.join(baseDir, d)).isDirectory());

    const userName = m.pushName || sender.split("@")[0];
    const ucapan = "Selamat Datang";
    const thumbnailUrl = "https://telegra.ph/file/placeholder.jpg";

    if (!text) {
        let menuText = `👋 Hai, *${userName}*!\n\n`;
        menuText += `Selamat datang di *Alice Bot RPG*\n\n`;
        menuText += `*Menu List*\n`;

        for (const cat of categories) {
            menuText += `      ⌯ .menu ${cat}\n`;
        }

        menuText += `\n_💡 Ketik .menu <kategori> untuk melihat detail_`;

        return await sock.sendMessage(m.key.remoteJid, { 
            text: menuText,
            contextInfo: {
                externalAdReply: {
                    title: "Alice Bot RPG",
                    body: ucapan,
                    thumbnailUrl: thumbnailUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });
    }

    const category = text.trim().toLowerCase();
    const targetDir = categories.find(c => c.toLowerCase() === category);

    if (!targetDir) {
        return await sock.sendMessage(m.key.remoteJid, { text: `❌ Kategori *"${category}"* tidak ditemukan.` }, { quoted: m });
    }

    let menuText = `*Menu ${targetDir.toUpperCase()}*\n\n`;
    
    // Fungsi rekursif untuk membaca file di subfolder
    const readFiles = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(readFiles(file));
            } else if (file.endsWith(".js")) {
                results.push(file);
            }
        });
        return results;
    };

    const files = readFiles(path.join(baseDir, targetDir));
    
    for (const file of files) {
        const fileName = path.basename(file, ".js");
        menuText += `      ⌯ .${fileName}\n`;
    }

    menuText += `\n_📊 Total: ${files.length} fitur_`;

    await sock.sendMessage(m.key.remoteJid, { text: menuText }, { quoted: m });
};

menuHandler.help = ["menu"];
menuHandler.tags = ["main"];
menuHandler.command = /^(menu|help)$/i;

export default menuHandler;
