import fs from "fs";
import path from "path";

const gfHandler = async (m, { sock, text }) => {
    const jid = m.key.remoteJid;

    if (!text) {
        return sock.sendMessage(jid, { text: "Format: .gf folder/file.js" }, { quoted: m });
    }

    const filePath = text.trim();

    if (!filePath.endsWith(".js")) {
        return sock.sendMessage(jid, { text: "File harus berekstensi .js" }, { quoted: m });
    }

    const fullPath = path.join(process.cwd(), "plugins", filePath);

    if (!fs.existsSync(fullPath)) {
        return sock.sendMessage(jid, { text: `❌ File plugins/${filePath} tidak ditemukan.` }, { quoted: m });
    }

    try {
        const fileBuffer = fs.readFileSync(fullPath);
        await sock.sendMessage(jid, { 
            document: fileBuffer,
            fileName: path.basename(filePath),
            mimetype: "application/javascript"
        }, { quoted: m });

        await sock.sendMessage(jid, { text: `✅ File plugins/${filePath} berhasil dikirim.` }, { quoted: m });
    } catch (err) {
        await sock.sendMessage(jid, { text: `❌ Gagal mengirim file: ${err.message}` }, { quoted: m });
    }
};

gfHandler.help = ["gf"];
gfHandler.tags = ["main"];
gfHandler.command = /^gf$/i;

export default gfHandler;