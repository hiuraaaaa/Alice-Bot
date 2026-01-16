import fs from 'fs';
import path from 'path';

const spamTracker = new Map();
const warnTracker = new Map();
const banList = new Set();

const configPath = './data/antispam_config.json';
const banListPath = './data/banned_users.json';

// Default config
let config = {
    enabled: true,
    maxMessages: 5,        // Max pesan dalam time window
    timeWindow: 10000,     // 10 detik
    warnLimit: 3,          // Jumlah warning sebelum ban
    banDuration: 3600000,  // 1 jam (ms)
    autoUnban: true        // Auto unban setelah durasi
};

// Load config
export function loadAntiSpamConfig() {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } else {
            saveAntiSpamConfig();
        }

        if (fs.existsSync(banListPath)) {
            const banned = JSON.parse(fs.readFileSync(banListPath, 'utf8'));
            banned.forEach(user => banList.add(user));
        }
    } catch (e) {
        console.error('[ANTISPAM] Error loading config:', e);
    }
}

export function saveAntiSpamConfig() {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (e) {
        console.error('[ANTISPAM] Error saving config:', e);
    }
}

export function saveBanList() {
    try {
        fs.writeFileSync(banListPath, JSON.stringify([...banList], null, 2));
    } catch (e) {
        console.error('[ANTISPAM] Error saving ban list:', e);
    }
}

// Cek apakah user sedang spam
export function checkSpam(sender, isOwner = false) {
    // Owner tidak kena spam detection
    if (isOwner || !config.enabled) {
        return { isSpam: false, isBanned: false };
    }

    const now = Date.now();
    
    // Cek apakah user di-ban
    if (isBanned(sender)) {
        return { isSpam: true, isBanned: true, reason: 'User is banned' };
    }

    const userSpam = spamTracker.get(sender) || [];
    
    // Filter pesan dalam time window
    const recentMessages = userSpam.filter(time => now - time < config.timeWindow);
    
    if (recentMessages.length >= config.maxMessages) {
        // User spam terdeteksi
        addWarning(sender);
        
        const warnings = getWarnings(sender);
        const remainingTime = Math.ceil((config.timeWindow - (now - recentMessages[0])) / 1000);
        
        return {
            isSpam: true,
            isBanned: false,
            warnings,
            remainingTime,
            willBan: warnings >= config.warnLimit
        };
    }
    
    // Tambah timestamp pesan
    recentMessages.push(now);
    spamTracker.set(sender, recentMessages);
    
    return { isSpam: false, isBanned: false };
}

// Tambah warning ke user
export function addWarning(sender) {
    const warnings = warnTracker.get(sender) || 0;
    const newWarnings = warnings + 1;
    
    warnTracker.set(sender, newWarnings);
    
    // Auto ban jika mencapai limit
    if (newWarnings >= config.warnLimit) {
        banUser(sender, config.banDuration);
    }
    
    return newWarnings;
}

// Get jumlah warning user
export function getWarnings(sender) {
    return warnTracker.get(sender) || 0;
}

// Reset warning user
export function resetWarnings(sender) {
    warnTracker.delete(sender);
    clearSpam(sender);
}

// Clear spam tracker
export function clearSpam(sender) {
    spamTracker.delete(sender);
}

// Ban user
export function banUser(sender, duration = config.banDuration) {
    const senderId = sender.split('@')[0];
    banList.add(senderId);
    saveBanList();
    
    // Auto unban setelah durasi
    if (config.autoUnban && duration > 0) {
        setTimeout(() => {
            unbanUser(sender);
        }, duration);
    }
    
    resetWarnings(sender);
}

// Unban user
export function unbanUser(sender) {
    const senderId = sender.split('@')[0];
    banList.delete(senderId);
    saveBanList();
    resetWarnings(sender);
}

// Cek apakah user di-ban
export function isBanned(sender) {
    const senderId = sender.split('@')[0];
    return banList.has(senderId);
}

// Get config
export function getAntiSpamConfig() {
    return { ...config };
}

// Update config
export function updateAntiSpamConfig(newConfig) {
    config = { ...config, ...newConfig };
    saveAntiSpamConfig();
}

// Get banned users list
export function getBannedUsers() {
    return [...banList];
}

// Get statistics
export function getSpamStats() {
    return {
        totalTracked: spamTracker.size,
        totalWarned: warnTracker.size,
        totalBanned: banList.size,
        config: { ...config }
    };
}

// Initialize
loadAntiSpamConfig(); 
