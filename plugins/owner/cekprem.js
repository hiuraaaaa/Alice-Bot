// plugins/cekprem.js - UPDATE VERSION
const handler = async (msg, { reply, sender, isOwner }) => {
    const userId = sender.split('@')[0].replace(/\D/g, '');
    
    // ⭐⭐ PAKAI LOGIC YANG SAMA DENGAN MENU.JS!
    const formattedPremium = (global.premium || []).map(p => p.toString().replace(/\D/g, ''));
    const isPremiumUser = isOwner || formattedPremium.includes(userId);
    
    console.log('[CEKPREM] User:', userId);
    console.log('[CEKPREM] Is owner:', isOwner);
    console.log('[CEKPREM] In premium array:', formattedPremium.includes(userId));
    console.log('[CEKPREM] Final result:', isPremiumUser);
    
    if (isPremiumUser) {
        return reply(
            `👑 *PREMIUM STATUS* ✅\n\n` +
            `User: @${userId}\n` +
            `Status: *${isOwner ? 'OWNER 👑' : 'PREMIUM MEMBER 💎'}*\n\n` +
            `✨ Premium Benefits Active!\n` +
            `• Unlimited Limit\n` +
            `• 50% Faster Cooldown\n` +
            `• No Anti-Spam Check\n` +
            `• Premium Commands Access\n\n` +
            `Thank you for being ${isOwner ? 'the Owner!' : 'a Premium Member!'} 🎉`,
            { mentions: [sender] }
        );
    } else {
        return reply(
            `💎 *PREMIUM STATUS* ❌\n\n` +
            `User: @${userId}\n` +
            `Status: *REGULAR USER*\n\n` +
            `📞 Contact owner to upgrade!\n` +
            `Get premium benefits today!`,
            { mentions: [sender] }
        );
    }
};

handler.help = ['cekprem', 'premium'];
handler.command = /^(cekprem|premium)$/i;
export default handler;