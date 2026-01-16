// file: plugins/owner/ceklimit.js
import { getLimitInfo, getLimit } from "../../lib/limitUtils.js";

const cekLimitHandler = async (m, { sock, sender, isOwner, isPremium, pushName }) => {
    // Normalisasi sender ID
    const senderId = sender.split("@")[0].replace(/\D/g, "");
    const userName = pushName || senderId;
    
    // Cek status premium/owner
    if (isOwner) {
        return await sock.sendMessage(m.key.remoteJid, {
            text: `👑 *OWNER LIMIT*\n\n` +
                  `♾️ Unlimited Access\n\n` +
                  `• No daily limits\n` +
                  `• Bypass all restrictions\n` +
                  `• Full system access\n\n` +
                  `_You own this bot!_`
        }, { quoted: m });
    }
    
    if (isPremium) {
        return await sock.sendMessage(m.key.remoteJid, {
            text: `💎 *PREMIUM LIMIT*\n\n` +
                  `♾️ Unlimited Access\n\n` +
                  `• No daily limits\n` +
                  `• 50% faster cooldown\n` +
                  `• Premium commands unlocked\n` +
                  `• Priority support\n\n` +
                  `_Thank you for your support!_`
        }, { quoted: m });
    }
    
    // Regular user
    const limitInfo = getLimitInfo(senderId);
    const remaining = getRemainingLimit(senderId);
    
    // Progress bar visual
    const percentage = Math.round((limitInfo.used / limitInfo.max) * 100);
    const progressBar = createProgressBar(percentage, 10);
    
    // Hitung waktu reset
    const resetTime = getResetTime();
    
    const text = `📊 *LIMIT STATUS - ${userName}*\n` +
                 `────────────────────\n\n` +
                 `📈 *DAILY USAGE*\n` +
                 `├ Digunakan: ${limitInfo.used}\n` +
                 `├ Sisa: ${remaining}\n` +
                 `├ Maksimum: ${limitInfo.max}\n` +
                 `╰ Progress: ${progressBar} ${percentage}%\n\n` +
                 `🕐 *RESET TIMER*\n` +
                 `╰ Tersisa: ${resetTime}\n\n` +
                 `💡 *TIPS:*\n` +
                 `• Limit reset setiap hari jam 00:00\n` +
                 `• Gunakan untuk fitur premium\n` +
                 `• Fitur reguler tetap gratis\n\n` +
                 `💎 *UPGRADE PREMIUM*\n` +
                 `Ketik *${global.prefix[0]}premium* untuk info lebih lanjut`;
    
    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
};

// Helper functions
function createProgressBar(percentage, length = 10) {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}]`;
}

function getResetTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours} jam ${minutes} menit`;
}

cekLimitHandler.help = ["ceklimit"];
cekLimitHandler.tags = ["main"];
cekLimitHandler.command = /^(ceklimit|limit|mylimit)$/i;

export default cekLimitHandler;