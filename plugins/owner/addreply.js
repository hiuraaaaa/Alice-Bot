import fs from 'fs';
import path from 'path';

const AUTOREPLY_FILE = path.join(process.cwd(), 'database', 'autoreply.json');

// Ensure database directory exists
const ensureDatabase = () => {
    const dir = path.dirname(AUTOREPLY_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(AUTOREPLY_FILE)) {
        fs.writeFileSync(AUTOREPLY_FILE, JSON.stringify([], null, 2));
    }
};

// Load auto replies
const loadAutoReplies = () => {
    ensureDatabase();
    try {
        const data = fs.readFileSync(AUTOREPLY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('[AUTOREPLY] Error loading:', error);
        return [];
    }
};

// Save auto replies
const saveAutoReplies = (data) => {
    try {
        fs.writeFileSync(AUTOREPLY_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('[AUTOREPLY] Error saving:', error);
        return false;
    }
};

const autoreplyHandler = async (m, { sock, text, isOwner, command }) => {
    // ✅ Owner only
    if (!isOwner) {
        return await sock.sendMessage(m.key.remoteJid, {
            text: '❌ *Perintah khusus Owner!*\n\n🔒 Anda tidak memiliki akses ke fitur ini.'
        }, { quoted: m });
    }

    const replies = loadAutoReplies();

    // ==========================================
    // ADD REPLY
    // ==========================================
    if (command === 'addreply') {
        if (!text || !text.includes('|')) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: `❌ *Format salah!*\n\n📝 *Cara Pakai:*\n${global.prefix[0]}addreply <keyword>|<response>\n\n💡 *Contoh:*\n${global.prefix[0]}addreply halo|Halo juga! Ada yang bisa dibantu?\n${global.prefix[0]}addreply price|Untuk info harga silakan hubungi admin\n\n⚠️ *Note:* Keyword tidak case-sensitive`
            }, { quoted: m });
        }

        const [keyword, ...responseArray] = text.split('|');
        const response = responseArray.join('|').trim();
        const cleanKeyword = keyword.trim().toLowerCase();

        if (!cleanKeyword || !response) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: '❌ *Keyword dan response tidak boleh kosong!*'
            }, { quoted: m });
        }

        // Check if keyword already exists
        const existingIndex = replies.findIndex(r => r.keyword === cleanKeyword);
        
        if (existingIndex !== -1) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: `❌ *Keyword sudah ada!*\n\n🔑 Keyword: *${cleanKeyword}*\n📝 Response saat ini:\n${replies[existingIndex].response}\n\n💡 Gunakan ${global.prefix[0]}delreply ${cleanKeyword} dulu, lalu tambahkan lagi.`
            }, { quoted: m });
        }

        // Add new reply
        replies.push({
            keyword: cleanKeyword,
            response: response,
            createdAt: new Date().toISOString(),
            createdBy: m.sender
        });

        if (saveAutoReplies(replies)) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: `✅ *Auto Reply berhasil ditambahkan!*\n\n🔑 *Keyword:* ${cleanKeyword}\n📝 *Response:*\n${response}\n\n📊 Total auto reply: ${replies.length}`
            }, { quoted: m });
        } else {
            return await sock.sendMessage(m.key.remoteJid, {
                text: '❌ *Gagal menyimpan auto reply!*\n\nCoba lagi beberapa saat.'
            }, { quoted: m });
        }
    }

    // ==========================================
    // DELETE REPLY
    // ==========================================
    if (command === 'delreply') {
        if (!text) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: `❌ *Masukkan keyword!*\n\n📝 *Cara Pakai:*\n${global.prefix[0]}delreply <keyword>\n\n💡 *Contoh:*\n${global.prefix[0]}delreply halo`
            }, { quoted: m });
        }

        const cleanKeyword = text.trim().toLowerCase();
        const index = replies.findIndex(r => r.keyword === cleanKeyword);

        if (index === -1) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: `❌ *Keyword tidak ditemukan!*\n\n🔑 Keyword: *${cleanKeyword}*\n\n💡 Gunakan ${global.prefix[0]}listreply untuk melihat semua keyword`
            }, { quoted: m });
        }

        const deleted = replies[index];
        replies.splice(index, 1);

        if (saveAutoReplies(replies)) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: `✅ *Auto Reply berhasil dihapus!*\n\n🔑 *Keyword:* ${deleted.keyword}\n📝 *Response:*\n${deleted.response}\n\n📊 Sisa auto reply: ${replies.length}`
            }, { quoted: m });
        } else {
            return await sock.sendMessage(m.key.remoteJid, {
                text: '❌ *Gagal menghapus auto reply!*\n\nCoba lagi beberapa saat.'
            }, { quoted: m });
        }
    }

    // ==========================================
    // LIST REPLY
    // ==========================================
    if (command === 'listreply') {
        if (replies.length === 0) {
            return await sock.sendMessage(m.key.remoteJid, {
                text: `📋 *Daftar Auto Reply*\n\n❌ Belum ada auto reply.\n\n💡 Tambahkan dengan:\n${global.prefix[0]}addreply <keyword>|<response>`
            }, { quoted: m });
        }

        let listText = `📋 *Daftar Auto Reply*\n\n`;
        listText += `📊 Total: ${replies.length} auto reply\n\n`;

        replies.forEach((reply, index) => {
            listText += `${index + 1}. 🔑 *${reply.keyword}*\n`;
            listText += `   📝 ${reply.response.substring(0, 50)}${reply.response.length > 50 ? '...' : ''}\n`;
            listText += `   📅 ${new Date(reply.createdAt).toLocaleDateString('id-ID')}\n\n`;
        });

        listText += `💡 *Cara Pakai:*\n`;
        listText += `• Tambah: ${global.prefix[0]}addreply <keyword>|<response>\n`;
        listText += `• Hapus: ${global.prefix[0]}delreply <keyword>`;

        return await sock.sendMessage(m.key.remoteJid, {
            text: listText
        }, { quoted: m });
    }
};

autoreplyHandler.help = ['addreply', 'delreply', 'listreply'];
autoreplyHandler.tags = ['owner'];
autoreplyHandler.command = /^(addreply|delreply|listreply)$/i;
autoreplyHandler.owner = true;

export default autoreplyHandler;