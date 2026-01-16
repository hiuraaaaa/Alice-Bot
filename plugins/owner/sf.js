import fs from "fs";
import path from "path";

const sfHandler = async (m, { sock, text }) => {
    if (!text) {
        return sock.sendMessage(m.key.remoteJid, { 
            text: `⚠️ *Format salah!*\n\n_💡 Penggunaan:_\n${global.prefix}sf folder/file.js\n\n_📌 Contoh:_\n${global.prefix}sf tools/myPlugin.js` 
        });
    }

    const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMsg) {
        return sock.sendMessage(m.key.remoteJid, { 
            text: `⚠️ *Reply pesan yang berisi kode plugin!*\n\n_💡 Cara pakai:_\n1. Kirim kode plugin\n2. Reply dengan ${global.prefix}sf folder/file.js` 
        });
    }

    const filePath = text.trim();

    if (!filePath.endsWith(".js")) {
        return sock.sendMessage(m.key.remoteJid, { 
            text: `⚠️ *File harus berekstensi .js*\n\n_💡 Contoh:_\n${global.prefix}sf tools/myPlugin.js` 
        });
    }

    const fullPath = path.join(process.cwd(), "plugins", filePath);
    const dir = path.dirname(fullPath);
    
    // Kirim loading message
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { 
        text: `_📝 Menyimpan plugin..._\n_⏳ Mohon tunggu..._` 
    });

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let code = quotedMsg.conversation 
        || quotedMsg.extendedTextMessage?.text 
        || quotedMsg.text 
        || "";

    code = code.trim();

    if (!code) {
        return sock.sendMessage(m.key.remoteJid, { 
            text: `⚠️ *Tidak ada kode yang bisa disimpan.*\n\n_💡 Pastikan pesan yang di-reply berisi kode plugin_` 
        }, { edit: loadingMsg.key });
    }

    try {
        fs.writeFileSync(fullPath, code, "utf-8");
        
        // Edit loading message jadi success
        await sock.sendMessage(m.key.remoteJid, { 
            text: `🎉 *Plugin berhasil dibuat!*\n\n📂 *Path:* \`plugins/${filePath}\`\n📝 *Size:* ${(code.length / 1024).toFixed(2)} KB\n\n_💡 Restart bot atau tunggu auto-reload untuk mengaktifkan plugin_` 
        }, { edit: loadingMsg.key });
    } catch (err) {
        // Edit loading message jadi error
        await sock.sendMessage(m.key.remoteJid, { 
            text: `🚫 *Gagal menyimpan plugin!*\n\n_🔍 Error:_ ${err.message}\n\n_💡 Periksa kembali path dan permissions_` 
        }, { edit: loadingMsg.key });
    }
};

sfHandler.help = ["sf"];
sfHandler.tags = ["owner"];
sfHandler.command = /^(sf|savefile)$/i;
sfHandler.owner = true;

export default sfHandler; 
