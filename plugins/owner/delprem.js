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
        } else if (cleanNumber.startsWith('8')) {
            finalNumber = '62' + cleanNumber;
        }
    }
    
    console.log('[DELPREM] Removing user:', finalNumber);
    
    try {
        // PERUBAHAN: Gunakan await karena removePremiumUser adalah async function
        const result = await removePremiumUser(finalNumber);
        
        console.log('[DELPREM] Result:', result);
        
        if (!result || typeof result !== 'object') {
            console.error('[DELPREM] Invalid result:', result);
            return reply('❌ Error: Hasil tidak valid dari sistem');
        }
        
        if (result.success === false) {
            const errorMessage = result.message || 'Gagal menghapus user premium';
            return reply(`❌ ${errorMessage}`);
        }
        
        if (!result.success) {
            return reply('❌ Gagal menghapus user premium');
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
            // Jangan return error, hanya log saja
        }
        
        return reply(
            `✅ ${result.message}\n\n` +
            `User: *${finalNumber}*\n` +
            `💾 Data dihapus dari database`
        );
        
    } catch (error) {
        console.error('[DELPREM] Unexpected error:', error);
        return reply(`❌ Error sistem: ${error.message || 'Unknown error'}`);
    }
};

handler.help = ['delprem', 'delpremium'];
handler.command = /^(delprem|delpremium)$/i;
handler.owner = true;

export default handler;