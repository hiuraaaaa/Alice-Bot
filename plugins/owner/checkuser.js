import { isPremiumUser } from '../../lib/premiumUtils.js';

const handler = async (msg, { reply, args, text }) => {
    let targetNumber = '';
    
    // Cara 1: Dari args (nomor)
    if (args.length > 0) {
        const numberMatch = args[0].match(/(\d{10,})/);
        if (numberMatch) targetNumber = numberMatch[1];
    }
    
    // Cara 2: Dari mention
    if (!targetNumber && msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        const mentionedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        if (mentionedJid.endsWith('@s.whatsapp.net')) {
            targetNumber = mentionedJid.split('@')[0];
        }
    }
    
    if (!targetNumber) {
        return reply('❌ Format: .checkuser @user atau .checkuser 628123456789');
    }
    
    // Clean & normalize
    const cleanNumber = targetNumber.replace(/\D/g, '');
    let finalNumber = cleanNumber;
    
    if (!cleanNumber.startsWith('62') && cleanNumber.length >= 10) {
        if (cleanNumber.startsWith('0')) {
            finalNumber = '62' + cleanNumber.substring(1);
        }
    }
    
    const isPremium = isPremiumUser(finalNumber);
    
    return reply(
        `🔍 *USER STATUS*\n\n` +
        `User: *${finalNumber}*\n` +
        `Premium: ${isPremium ? '✅ YES 👑' : '❌ NO'}\n\n` +
        `${isPremium ? 'This user has premium benefits!' : 'This user can upgrade to premium.'}`,
        { mentions: [`${finalNumber}@s.whatsapp.net`] }
    );
};

handler.help = ['checkuser'];
handler.command = /^check(user)?$/i;
handler.owner = true;

export default handler;