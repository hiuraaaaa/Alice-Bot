import { addPremiumUser } from '../../lib/premiumUtils.js';

const handler = async (msg, { reply, sock, args, text }) => {
    console.log('[ADDPREM] Command triggered');
    
    let targetNumber = '';
    
    // ======================
    // METHOD 1: Dari args (contoh: .addprem 628123456789)
    // ======================
    if (args.length > 0) {
        // Ambil argumen pertama
        const arg = args[0];
        
        // Cari nomor dalam argumen
        const numberMatch = arg.match(/(\d{10,})/);
        if (numberMatch) {
            targetNumber = numberMatch[1];
            console.log('[ADDPREM] Found number in args:', targetNumber);
        }
        
        // Atau mungkin argumen adalah @mention (tapi tidak akan work di conversation)
        if (arg.startsWith('@')) {
            return reply(
                '⚠️ *Mention tidak didukung!*\n\n' +
                'Format yang benar:\n' +
                '• `.addprem 628123456789`\n' +
                '• `.addprem` (lalu ikuti instruksi)'
            );
        }
    }
    
    // ======================
    // METHOD 2: Tanya nomor jika tidak ada args
    // ======================
    if (!targetNumber) {
        console.log('[ADDPREM] No number provided, asking for input');
        return reply(
            '📱 *Tambah Premium User*\n\n' +
            'Silakan masukkan nomor WhatsApp (contoh: 628123456789)\n\n' +
            'Ketik: `.addprem <nomor>`\n' +
            'Contoh: `.addprem 628123456789`'
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
        return reply('❌ Nomor tidak valid! Minimal 10 digit.\nContoh: 628123456789');
    }
    
    // Pastikan format 62xxx
    let finalNumber = cleanNumber;
    if (!cleanNumber.startsWith('62') && cleanNumber.length >= 10) {
        // Jika 08xxx, convert ke 628xxx
        if (cleanNumber.startsWith('0')) {
            finalNumber = '62' + cleanNumber.substring(1);
            console.log('[ADDPREM] Converted to 62 format:', finalNumber);
        }
        // Jika +62, hilangkan +
        else if (cleanNumber.startsWith('+62')) {
            finalNumber = cleanNumber.substring(1);
            console.log('[ADDPREM] Removed +:', finalNumber);
        }
    }
    
    console.log('[ADDPREM] Final number:', finalNumber);
    
    // Add premium
    const result = addPremiumUser(finalNumber);
    console.log('[ADDPREM] Result:', result);
    
    if (!result.success) {
        return reply('❌ ' + result.message);
    }
    
    // Coba kirim notifikasi ke user
    const userJid = `${finalNumber}@s.whatsapp.net`;
    try {
        await sock.sendMessage(userJid, { 
            text: `🎉 *SELAMAT!*\n\nKamu telah menjadi Premium User! 👑\n\n✨ *Benefits Premium:*\n• Unlimited Limit\n• 50% Cooldown Reduction\n• No Anti-Spam Check\n• Access Premium Commands\n• Priority Support\n\nNikmati fitur premium! 💎` 
        });
        console.log('[ADDPREM] Notification sent to:', userJid);
    } catch (e) {
        console.error('[ADDPREM] Failed to notify user:', e);
        // Lanjut meski notif gagal
    }
    
    // Reply ke sender
    return reply(
        `✅ ${result.message}\n\n` +
        `User: *${finalNumber}* 👑\n` +
        `💾 Data tersimpan di database\n\n` +
        `📋 Cek dengan: .listprem`
    );
};

handler.help = ['addprem', 'addpremium'];
handler.command = /^(addprem|addpremium)$/i;
handler.owner = true;

export default handler;