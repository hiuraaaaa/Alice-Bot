import fs from 'fs';
import path from 'path';

const AUTOREPLY_FILE = path.join(process.cwd(), 'database', 'autoreply.json');

const loadAutoReplies = () => {
    try {
        if (!fs.existsSync(AUTOREPLY_FILE)) return [];
        const data = fs.readFileSync(AUTOREPLY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const autoreplyChecker = async (m, { sock }) => {
    // Skip jika pesan dari bot sendiri atau tidak ada text
    if (m.key.fromMe || !m.text) return false;

    const replies = loadAutoReplies();
    if (replies.length === 0) return false;

    const userText = m.text.toLowerCase().trim();

    // Cari keyword yang cocok
    const match = replies.find(r => userText.includes(r.keyword));

    if (match) {
        await sock.sendMessage(m.key.remoteJid, {
            text: match.response
        }, { quoted: m });
        return true; // Return true untuk stop execution plugin lain
    }

    return false;
};

// Ini tidak pakai command, jalan otomatis untuk setiap pesan
autoreplyChecker.all = true; // Flag untuk jalankan di setiap pesan

export default autoreplyChecker;