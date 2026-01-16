import { getAllPremiumUsers, getPremiumStats } from '../../lib/premiumUtils.js';

const handler = async (msg, { reply }) => {
    const users = getAllPremiumUsers();
    const stats = getPremiumStats();
    
    console.log('[LISTPREM] Stats:', stats);
    
    if (users.length === 0) {
        return reply('📋 *Premium Users*\n\nTidak ada premium user saat ini.');
    }
    
    let text = '📋 *PREMIUM USERS LIST*\n\n';
    
    users.forEach((user, index) => {
        // Tampilkan semua user sama
        text += `${index + 1}. @${user}\n`;
    });
    
    text += `\n━━━━━━━━━━━━━━━━\n`;
    text += `*Total:* ${stats.total} user${stats.total > 1 ? 's' : ''}\n`;
    
    // Tampilkan stats
    if (stats.valid) {
        text += `*Settings:* ${stats.manual} ⚙️\n`;
        text += `*Commands:* ${stats.dynamic} 💾`;
    } else {
        text += `⚠️ *Warning: Data tidak konsisten!*\n`;
        text += `Settings: ${stats.manual} | Commands: ${stats.dynamic}`;
    }
    
    const mentions = users.map(u => `${u}@s.whatsapp.net`);
    
    return reply(text, { mentions });
};

handler.help = ['listprem', 'listpremium'];
handler.command = /^(listprem|listpremium)$/i;
handler.owner = true;

export default handler;