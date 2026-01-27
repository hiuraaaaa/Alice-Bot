const antiToxicDB = new Map();
const badWords = ['anjing', 'babi', 'kontol', 'memek', 'bangsat', 'tolol', 'goblok'];

const aliceHandler = async (m, { sock, reply, args }) => {
    const from = m.key.remoteJid;
    const cmd = args[0]?.toLowerCase();

    if (cmd === 'on') {
        antiToxicDB.set(from, true);
        return reply('✅ Anti-toxic *DIAKTIFKAN*');
    }

    if (cmd === 'off') {
        antiToxicDB.delete(from);
        return reply('✅ Anti-toxic *DINONAKTIFKAN*');
    }

    return reply('Status: ' + (antiToxicDB.get(from) ? 'Aktif ✅' : 'Nonaktif ❌'));
};

aliceHandler.all = async (m, { sock, from, body, isOwner, sender }) => {
    const isGroup = from.endsWith('@g.us');
    
    if (!isGroup || isOwner || !antiToxicDB.get(from)) return;

    const text = body.toLowerCase();
    const hasBadWord = badWords.some(word => text.includes(word));
    
    if (hasBadWord) {
        try {
            const metadata = await sock.groupMetadata(from);
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const admins = metadata.participants?.filter(p => p.admin)?.map(p => p.id) || [];
            
            const isAdmin = admins.includes(sender);
            const isBotAdmin = admins.includes(botNumber);

            if (isAdmin) return;

            if (isBotAdmin) {
                await sock.sendMessage(from, { delete: m.key });
                await sock.sendMessage(from, {
                    text: `⚠️ *Kata kasar terdeteksi!*\n\n@${sender.split('@')[0]}, harap jaga bahasa!`,
                    mentions: [sender]
                });
            }
        } catch (err) {
            console.error(err);
        }
    }
};

aliceHandler.command = /^(antitoxic|antibadword)$/i;
aliceHandler.group = true;
aliceHandler.admin = true;
export default aliceHandler;