import { addPremiumUser } from '../../lib/premiumUtils.js';

const aliceHandler = async (msg, { reply, sock, args, text }) => {
    let targetNumber = '';
    let targetJid = '';
    let mentionedPushName = '';
    
    if (text) {
        const numberMatch = text.match(/(\d{10,})/);
        if (numberMatch) {
            targetNumber = numberMatch[1];
        }
    }
    
    const isGroup = msg.key.remoteJid?.endsWith('@g.us');
    
    if (isGroup && msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        const mentionedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        
        if (mentionedJid.endsWith('@lid')) {
            try {
                const metadata = await sock.groupMetadata(msg.key.remoteJid);
                const mentionedUser = metadata.participants.find(p => {
                    const mentionedId = mentionedJid.split('@')[0];
                    return p.id.includes(mentionedId) || 
                           p.id.replace(/\D/g, '').includes(mentionedId);
                });
                
                if (mentionedUser) {
                    const userJid = mentionedUser.id;
                    if (userJid.endsWith('@s.whatsapp.net')) {
                        targetJid = userJid;
                        targetNumber = userJid.split('@')[0];
                        mentionedPushName = mentionedUser.notify || mentionedUser.name || 'User';
                    }
                }
            } catch (err) {
                console.error(err);
            }
        } else if (mentionedJid.endsWith('@s.whatsapp.net')) {
            targetJid = mentionedJid;
            targetNumber = mentionedJid.split('@')[0];
        }
    }
    
    if (!targetNumber) {
        return reply(
            `📱 *Tambah Premium User*\n\n` +
            `Pilih salah satu cara:\n\n` +
            `1. *Dengan nomor langsung:*\n` +
            `   \`${global.prefix}addprem 628123456789\`\n\n` +
            `2. *Mention di group:*\n` +
            `   \`${global.prefix}addprem @user\` (hanya di group)\n\n` +
            `3. *Reply pesan user:*\n` +
            `   Reply pesan dengan \`${global.prefix}addprem\``
        );
    }
    
    const cleanNumber = targetNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 10) {
        return reply('❌ Nomor tidak valid! Minimal 10 digit.');
    }
    
    let finalNumber = cleanNumber;
    if (!cleanNumber.startsWith('62') && cleanNumber.length >= 10) {
        if (cleanNumber.startsWith('0')) {
            finalNumber = '62' + cleanNumber.substring(1);
        } else if (cleanNumber.startsWith('+62')) {
            finalNumber = cleanNumber.substring(1);
        }
    }
    
    const result = addPremiumUser(finalNumber);
    
    if (!result.success) {
        return reply('❌ ' + result.message);
    }
    
    const notifyJid = targetJid || `${finalNumber}@s.whatsapp.net`;
    try {
        await sock.sendMessage(notifyJid, { 
            text: `🎉 *SELAMAT!*\n\n` +
                `Kamu telah menjadi Premium User! 👑\n\n` +
                `✨ *Benefits Premium:*\n` +
                `• Unlimited Limit\n` +
                `• 50% Cooldown Reduction\n` +
                `• No Anti-Spam Check\n` +
                `• Access Premium Commands\n` +
                `• Priority Support\n\n` +
                `Nikmati fitur premium! 💎`
        });
    } catch (err) {
        console.error(err);
    }
    
    const displayName = mentionedPushName ? `@${mentionedPushName}` : `*${finalNumber}*`;
    return reply(
        `✅ ${result.message}\n\n` +
        `User: ${displayName} 👑\n` +
        `Nomor: ${finalNumber}\n` +
        `💾 Data tersimpan di database\n\n` +
        `📋 Cek dengan: ${global.prefix}listprem`
    );
};

aliceHandler.help = ["addprem", "addpremium"];
aliceHandler.tags = ["owner"];
aliceHandler.command = /^(addprem|addpremium)$/i;
aliceHandler.owner = true;
aliceHandler.limit = false;

export default aliceHandler;
