// owner-addprem.js - VERSION FINAL
import { addPremiumUser } from '../../lib/premiumUtils.js';

const handler = async (msg, { reply, sock, args, text }) => {
    console.log('[ADDPREM] Command triggered');
    
    let targetNumber = '';
    let targetJid = '';
    let mentionedPushName = '';
    
    // ======================
    // METHOD 1: Dari TEXT/ARGS (nomor langsung)
    // ======================
    if (text) {
        const numberMatch = text.match(/(\d{10,})/);
        if (numberMatch) {
            targetNumber = numberMatch[1];
            console.log('[ADDPREM] Found number in text:', targetNumber);
        }
    }
    
    // ======================
    // METHOD 2: Dari MENTION di GROUP (gunakan group metadata)
    // ======================
    const isGroup = msg.key.remoteJid?.endsWith('@g.us');
    
    if (isGroup && msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
        console.log('[ADDPREM] Mention in group detected');
        
        const mentionedJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        console.log('[ADDPREM] Mentioned JID:', mentionedJid);
        
        // Jika ini ID Facebook (@lid), cari nomor asli dari group metadata
        if (mentionedJid.endsWith('@lid')) {
            try {
                // Ambil semua participant dari group
                const metadata = await sock.groupMetadata(msg.key.remoteJid);
                console.log('[ADDPREM] Group participants count:', metadata.participants.length);
                
                // Cari user dengan pushName atau ID yang cocok
                const mentionedUser = metadata.participants.find(p => {
                    // Cek jika participant ID mengandung mentioned ID (tanpa @lid)
                    const mentionedId = mentionedJid.split('@')[0];
                    return p.id.includes(mentionedId) || 
                           p.id.replace(/\D/g, '').includes(mentionedId);
                });
                
                if (mentionedUser) {
                    // Ambil nomor dari participant ID
                    const userJid = mentionedUser.id;
                    if (userJid.endsWith('@s.whatsapp.net')) {
                        targetJid = userJid;
                        targetNumber = userJid.split('@')[0];
                        mentionedPushName = mentionedUser.notify || mentionedUser.name || 'User';
                        console.log('[ADDPREM] Found real user in group:', targetNumber, mentionedPushName);
                    }
                } else {
                    console.log('[ADDPREM] Could not find user in group metadata');
                }
            } catch (error) {
                console.error('[ADDPREM] Error fetching group metadata:', error);
            }
        } else if (mentionedJid.endsWith('@s.whatsapp.net')) {
            // Sudah nomor asli
            targetJid = mentionedJid;
            targetNumber = mentionedJid.split('@')[0];
        }
    }
    
    // ======================
    // METHOD 3: Minta input manual
    // ======================
    if (!targetNumber) {
        console.log('[ADDPREM] No valid target found');
        return reply(
            '📱 *Tambah Premium User*\n\n' +
            'Pilih salah satu cara:\n\n' +
            '1. *Dengan nomor langsung:*\n' +
            '   `.addprem 628123456789`\n\n' +
            '2. *Mention di group:*\n' +
            '   `.addprem @user` (hanya di group)\n\n' +
            '3. *Reply pesan user:*\n' +
            '   Reply pesan dengan `.addprem`'
        );
    }
    
    // ======================
    // PROCESS NUMBER
    // ======================
    // Clean number
    const cleanNumber = targetNumber.replace(/\D/g, '');
    console.log('[ADDPREM] Clean number:', cleanNumber);
    
    // Validasi
    if (cleanNumber.length < 10) {
        console.error('[ADDPREM] Invalid phone number:', cleanNumber);
        return reply('❌ Nomor tidak valid! Minimal 10 digit.');
    }
    
    // Convert format ke 62
    let finalNumber = cleanNumber;
    if (!cleanNumber.startsWith('62') && cleanNumber.length >= 10) {
        if (cleanNumber.startsWith('0')) {
            finalNumber = '62' + cleanNumber.substring(1);
            console.log('[ADDPREM] Converted 0 to 62:', finalNumber);
        } else if (cleanNumber.startsWith('+62')) {
            finalNumber = cleanNumber.substring(1);
            console.log('[ADDPREM] Removed +:', finalNumber);
        }
    }
    
    console.log('[ADDPREM] Final number to add:', finalNumber);
    
    // Add premium
    const result = addPremiumUser(finalNumber);
    console.log('[ADDPREM] Result:', result);
    
    if (!result.success) {
        return reply('❌ ' + result.message);
    }
    
    // Kirim notifikasi ke user
    const notifyJid = targetJid || `${finalNumber}@s.whatsapp.net`;
    try {
        await sock.sendMessage(notifyJid, { 
            text: `🎉 *SELAMAT!*\n\nKamu telah menjadi Premium User! 👑\n\n✨ *Benefits Premium:*\n• Unlimited Limit\n• 50% Cooldown Reduction\n• No Anti-Spam Check\n• Access Premium Commands\n• Priority Support\n\nNikmati fitur premium! 💎` 
        });
        console.log('[ADDPREM] Notification sent to:', notifyJid);
    } catch (e) {
        console.error('[ADDPREM] Failed to notify user:', e);
    }
    
    // Reply ke sender
    const displayName = mentionedPushName ? `@${mentionedPushName}` : `*${finalNumber}*`;
    return reply(
        `✅ ${result.message}\n\n` +
        `User: ${displayName} 👑\n` +
        `Nomor: ${finalNumber}\n` +
        `💾 Data tersimpan di database\n\n` +
        `📋 Cek dengan: .listprem`
    );
};

handler.help = ['addprem', 'addpremium'];
handler.command = /^(addprem|addpremium)$/i;
handler.owner = true;

export default handler;