import fs from 'fs';

const spamTracker = new Map();
const warnTracker = new Map();
const banList = new Map(); // ✅ Ubah ke Map untuk simpan timestamp

const configPath = './data/antispam_config.json';
const banListPath = './data/banned_users.json';

function normalizeSender(sender) {
    return String(sender).split('@')[0].replace(/\D/g, '');
}

let config = {
    enabled: true,
    maxMessages: 5,
    timeWindow: 10000,
    warnLimit: 3,
    banDuration: 3600000,
    autoUnban: true
};

export function loadAntiSpamConfig() {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            console.log('[ANTISPAM] ✅ Config loaded');
        } else {
            saveAntiSpamConfig();
            console.log('[ANTISPAM] ✅ Config created');
        }

        if (fs.existsSync(banListPath)) {
            const banned = JSON.parse(fs.readFileSync(banListPath, 'utf8'));
            
            if (Array.isArray(banned)) {
                banned.forEach(user => banList.set(user, Date.now() + config.banDuration));
            } else {
                Object.entries(banned).forEach(([user, until]) => banList.set(user, until));
            }
            
            console.log(`[ANTISPAM] ✅ Loaded ${banList.size} banned users`);
        }
    } catch (e) {
        console.error('[ANTISPAM] ❌ Error loading config:', e);
    }
}

export function saveAntiSpamConfig() {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (e) {
        console.error('[ANTISPAM] ❌ Error saving config:', e);
    }
}

export function saveBanList() {
    try {
        const banData = {};
        for (const [user, until] of banList.entries()) {
            banData[user] = until;
        }
        fs.writeFileSync(banListPath, JSON.stringify(banData, null, 2));
    } catch (e) {
        console.error('[ANTISPAM] ❌ Error saving ban list:', e);
    }
}

// ✅ Cleanup expired bans
function cleanupExpiredBans() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [userId, until] of banList.entries()) {
        if (until <= now) {
            banList.delete(userId);
            warnTracker.delete(userId);
            cleaned++;
            console.log(`[ANTISPAM] ⏰ Auto-unban: ${userId}`);
        }
    }
    
    if (cleaned > 0) saveBanList();
    return cleaned;
}

// ✅ FIXED: Spam detection logic
export function checkSpam(sender, isOwner = false) {
    const senderId = normalizeSender(sender);
    
    if (isOwner || !config.enabled) {
        return { isSpam: false, isBanned: false };
    }

    const now = Date.now();
    
    // Cleanup expired bans
    cleanupExpiredBans();
    
    // ✅ Check if banned
    if (banList.has(senderId)) {
        const until = banList.get(senderId);
        
        if (until > now) {
            const remaining = Math.ceil((until - now) / 1000);
            console.log(`[ANTISPAM] 🚫 Banned user: ${senderId} (${remaining}s)`);
            return { 
                isSpam: false,
                isBanned: true,
                remainingTime: remaining
            };
        } else {
            banList.delete(senderId);
            saveBanList();
        }
    }

    // ✅ Get recent messages
    const userSpam = spamTracker.get(senderId) || [];
    const recentMessages = userSpam.filter(time => now - time < config.timeWindow);
    
    // ✅ ADD current message FIRST
    recentMessages.push(now);
    spamTracker.set(senderId, recentMessages);
    
    console.log(`[ANTISPAM] 📊 ${senderId}: ${recentMessages.length}/${config.maxMessages} msgs`);
    
    // ✅ CHECK spam AFTER adding message
    if (recentMessages.length > config.maxMessages) {
        console.warn(`[ANTISPAM] ⚠️ Spam from ${senderId} (${recentMessages.length} msgs)`);
        
        const warnings = addWarning(senderId);
        const remainingTime = Math.ceil((config.timeWindow - (now - recentMessages[0])) / 1000);
        
        return {
            isSpam: true,
            isBanned: false,
            warnings,
            remainingTime,
            willBan: warnings >= config.warnLimit
        };
    }
    
    return { isSpam: false, isBanned: false };
}

export function addWarning(sender) {
    const senderId = normalizeSender(sender);
    const warnings = warnTracker.get(senderId) || 0;
    const newWarnings = warnings + 1;
    
    warnTracker.set(senderId, newWarnings);
    console.warn(`[ANTISPAM] ⚠️ Warning ${newWarnings}/${config.warnLimit} for ${senderId}`);
    
    if (newWarnings >= config.warnLimit) {
        console.error(`[ANTISPAM] 🚫 Banning ${senderId}`);
        banUser(senderId, config.banDuration);
    }
    
    return newWarnings;
}

export function getWarnings(sender) {
    const senderId = normalizeSender(sender);
    return warnTracker.get(senderId) || 0;
}

export function resetWarnings(sender) {
    const senderId = normalizeSender(sender);
    warnTracker.delete(senderId);
    clearSpam(senderId);
    console.log(`[ANTISPAM] ✅ Reset warnings: ${senderId}`);
}

export function clearSpam(sender) {
    const senderId = normalizeSender(sender);
    spamTracker.delete(senderId);
}

export function banUser(sender, duration = config.banDuration) {
    const senderId = normalizeSender(sender);
    const until = Date.now() + duration;
    
    banList.set(senderId, until);
    saveBanList();
    
    console.error(`[ANTISPAM] 🚫 BANNED: ${senderId} until ${new Date(until).toLocaleString()}`);
    
    resetWarnings(senderId);
    clearSpam(senderId);
}

export function unbanUser(sender) {
    const senderId = normalizeSender(sender);
    const was = banList.has(senderId);
    
    banList.delete(senderId);
    saveBanList();
    resetWarnings(senderId);
    clearSpam(senderId);
    
    if (was) console.log(`[ANTISPAM] ✅ UNBANNED: ${senderId}`);
    return was;
}

export function isBanned(sender) {
    const senderId = normalizeSender(sender);
    
    if (!banList.has(senderId)) return false;
    
    const until = banList.get(senderId);
    const now = Date.now();
    
    if (until <= now) {
        banList.delete(senderId);
        saveBanList();
        return false;
    }
    
    return true;
}

export function getAntiSpamConfig() {
    return { ...config };
}

export function updateAntiSpamConfig(newConfig) {
    config = { ...config, ...newConfig };
    saveAntiSpamConfig();
    console.log('[ANTISPAM] ⚙️ Config updated:', config);
}

export function getBannedUsers() {
    const now = Date.now();
    const result = [];
    
    for (const [user, until] of banList.entries()) {
        if (until > now) {
            result.push({
                id: user,
                bannedUntil: until,
                remainingTime: Math.ceil((until - now) / 1000)
            });
        }
    }
    
    return result;
}

export function getSpamStats() {
    return {
        totalTracked: spamTracker.size,
        totalWarned: warnTracker.size,
        totalBanned: banList.size,
        config: { ...config }
    };
}

// Cleanup interval
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [userId, timestamps] of spamTracker.entries()) {
        const recent = timestamps.filter(time => now - time < config.timeWindow * 2);
        if (recent.length === 0) {
            spamTracker.delete(userId);
            cleaned++;
        } else {
            spamTracker.set(userId, recent);
        }
    }
    
    const expired = cleanupExpiredBans();
    
    if (cleaned > 0 || expired > 0) {
        console.log(`[ANTISPAM] 🧹 Cleaned: ${cleaned} trackers, ${expired} bans`);
    }
}, 60000);

loadAntiSpamConfig(); 
