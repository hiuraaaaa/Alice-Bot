import { getGroup } from './groupSystem.js';
import { logger } from '../logger.js';

export async function checkAntiLink(sock, msg) {
    if (!msg.key.remoteJid.endsWith('@g.us')) return;
    
    const from = msg.key.remoteJid;
    const groupData = await getGroup(from);
    
    if (!groupData.antilink.enabled) return;

    const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
    const linkRegex = /chat.whatsapp.com\/(?:invite\/)?([0-9A-Za-z]{20,24})/i;
    
    if (linkRegex.test(body)) {
        const sender = msg.key.participant || msg.key.remoteJid;
        
        // Check if sender is admin
        const metadata = await sock.groupMetadata(from);
        const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
        
        if (admins.includes(sender)) return;

        logger.warn(`Anti-link triggered by ${sender} in ${from}`);
        
        // Delete message
        await sock.sendMessage(from, { delete: msg.key });
        
        if (groupData.antilink.action === 'kick') {
            await sock.groupParticipantsUpdate(from, [sender], 'remove');
            await sock.sendMessage(from, { text: `❌ *Anti-Link Terdeteksi!*\n\n@${sender.split('@')[0]} telah dikeluarkan karena mengirim link grup.`, mentions: [sender] });
        } else {
            await sock.sendMessage(from, { text: `⚠️ *Anti-Link Terdeteksi!*\n\n@${sender.split('@')[0]}, dilarang mengirim link grup di sini!`, mentions: [sender] });
        }
    }
}
