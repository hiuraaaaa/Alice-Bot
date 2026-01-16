import fs from "fs";
import path from "path";

const rfHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    if (!text) {
        return sock.sendMessage(jid, { 
            text: `⚠️ *Format salah!*\n\n_💡 Penggunaan:_\n${global.prefix}rf folder/file.js\n\n_📌 Contoh:_\n${global.prefix}rf tools/oldPlugin.js` 
        }, { quoted: m });
    }

    const filePath = text.trim();

    if (!filePath.endsWith(".js")) {
        return sock.sendMessage(jid, { 
            text: `⚠️ *File harus berekstensi .js*\n\n_💡 Contoh:_\n${global.prefix}rf tools/oldPlugin.js` 
        }, { quoted: m });
    }

    const fullPath = path.join(process.cwd(), "plugins", filePath);

    if (!fs.existsSync(fullPath)) {
        return sock.sendMessage(jid, { 
            text: `🔍 *File tidak ditemukan!*\n\n_📂 Path:_ \`plugins/${filePath}\`\n\n_💡 Periksa kembali nama file dan folder_` 
        }, { quoted: m });
    }

    // Kirim loading message
    const loadingMsg = await sock.sendMessage(jid, { 
        text: `_🗑️ Menghapus plugin..._\n_⏳ Mohon tunggu..._` 
    }, { quoted: m });

    try {
        // Get file size sebelum dihapus
        const stats = fs.statSync(fullPath);
        const fileSize = (stats.size / 1024).toFixed(2);

        // Hapus file
        fs.unlinkSync(fullPath);

        // Edit loading message jadi success
        await sock.sendMessage(jid, { 
            text: `🗑️ *Plugin berhasil dihapus!*\n\n📂 *Path:* \`plugins/${filePath}\`\n📝 *Size:* ${fileSize} KB\n\n_💡 Restart bot atau tunggu auto-reload untuk menerapkan perubahan_` 
        }, { quoted: m, edit: loadingMsg.key });

    } catch (err) {
        // Edit loading message jadi error
        await sock.sendMessage(jid, { 
            text: `🚫 *Gagal menghapus plugin!*\n\n_🔍 Error:_ ${err.message}\n\n_💡 Periksa permissions file_` 
        }, { quoted: m, edit: loadingMsg.key });
    }
};

rfHandler.help = ["rf"];
rfHandler.tags = ["owner"];
rfHandler.command = /^(rf|removefile|deletefile)$/i;
rfHandler.owner = true; // Hanya owner yang bisa

export default rfHandler;