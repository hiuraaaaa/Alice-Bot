const antiLinkDB = new Map();

const aliceHandler = async (m, { sock, reply, args }) => {
    const from = m.key.remoteJid;
    const cmd = args[0]?.toLowerCase();

    if (cmd === 'on') {
        antiLinkDB.set(from, true);
        return reply('✅ Anti-link *DIAKTIFKAN*');
    }

    if (cmd === 'off') {
        antiLinkDB.delete(from);
        return reply('✅ Anti-link *DINONAKTIFKAN*');
    }

    return reply('Status: ' + (antiLinkDB.get(from) ? 'Aktif ✅' : 'Nonaktif ❌'));
};

// ✨ Ini yang monitor setiap pesan
aliceHandler.all = async (m, { sock, from, body, isOwner, sender }) => {
    const isGroup = from.endsWith('@g.us');
    
    // Skip kalau bukan group atau owner atau anti-link off
    if (!isGroup || isOwner || !antiLinkDB.get(from)) return;

    // Regex detect link
    const linkRegex = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/gi;
    
    if (linkRegex.test(body)) {
        try {
            const metadata = await sock.groupMetadata(from);
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const admins = metadata.participants?.filter(p => p.admin)?.map(p => p.id) || [];
            
            const isAdmin = admins.includes(sender);
            const isBotAdmin = admins.includes(botNumber);

            // Skip kalau yang kirim admin
            if (isAdmin) return;

            // Hapus pesan kalau bot admin
            if (isBotAdmin) {
                await sock.sendMessage(from, { delete: m.key });
                await sock.sendMessage(from, {
                    text: `🚫 *Link terdeteksi!*\n\n@${sender.split('@')[0]} mengirim link dan pesan telah dihapus.`,
                    mentions: [sender]
                });
            }
        } catch (err) {
            console.error(err);
        }
    }
};

aliceHandler.command = /^(antilink)$/i;
aliceHandler.group = true;
aliceHandler.admin = true;
export default aliceHandler;