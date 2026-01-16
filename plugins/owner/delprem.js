import { removePremiumUser } from '../../lib/premiumUtils.js';

const handler = async (msg, { reply, sock, args }) => {
    console.log('[DELPREM] Command triggered');
    
    let targetNumber = '';
    
    // Ambil dari args
    if (args.length > 0) {
        const arg = args[0];
        const numberMatch = arg.match(/(\d{10,})/);
        if (numberMatch) {
            targetNumber = numberMatch[1];
        }
    }
    
    if (!targetNumber) {
        return reply(
            '🗑️ *Hapus Premium User*\n\n' +
            'Silakan masukkan nomor WhatsApp\n\n' +
            'Contoh: `.delprem 628123456789`'
        );
    }
    
    // Clean number
    const cleanNumber = targetNumber.replace(/\D/g, '');
    
    // Convert ke format 62
    let finalNumber = cleanNumber;
    if (!cleanNumber.startsWith('62') && cleanNumber.length >= 10) {
        if (cleanNumber.startsWith('0')) {
            finalNumber = '62' + cleanNumber.substring(1);
        } else if (cleanNumber.startsWith('+62')) {
            finalNumber = cleanNumber.substring(1);
        }
    }
    
    console.log('[DELPREM] Removing user:', finalNumber);
    
    const result = removePremiumUser(finalNumber);
    
    if (!result.success) {
        return reply('❌ ' + result.message);
    }
    
    // Notify user
    const userJid = `${finalNumber}@s.whatsapp.net`;
    try {
        await sock.sendMessage(userJid, { 
            text: `⚠️ *PEMBERITAHUAN*\n\nStatus premium kamu telah berakhir.\n\nTerima kasih telah menggunakan layanan premium! 🙏` 
        });
        console.log('[DELPREM] Notification sent to:', userJid);
    } catch (e) {
        console.error('[DELPREM] Failed to notify user:', e);
    }
    
    return reply(
        `✅ ${result.message}\n\n` +
        `User: *${finalNumber}*\n` +
        `💾 Data dihapus dari database`
    );
};

handler.help = ['delprem', 'delpremium'];
handler.command = /^(delprem|delpremium)$/i;
handler.owner = true;

export default handler;