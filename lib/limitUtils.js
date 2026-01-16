import fs from "fs";
import path from "path";

// Path database (selalu relatif ke folder project)
const DB_PATH = path.join(process.cwd(), "database/limit.json");

// Pastikan folder database ada
const DB_FOLDER = path.join(process.cwd(), "database");
if (!fs.existsSync(DB_FOLDER)) {
    fs.mkdirSync(DB_FOLDER, { recursive: true });
}

// Config default
const DEFAULT_CONFIG = {
    dailyLimit: 20,
    premiumMultiplier: 2,
    resetHour: 0 // Reset jam 00:00
};

// ================================
// 🔹 Pastikan file JSON ada
// ================================
function ensureDB() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(
            DB_PATH,
            JSON.stringify({ 
                users: {}, 
                lastReset: new Date().setHours(0, 0, 0, 0),
                config: DEFAULT_CONFIG 
            }, null, 2)
        );
    }
}

// ================================
// 🔹 Load database
// ================================
function loadDB() {
    ensureDB();
    const data = JSON.parse(fs.readFileSync(DB_PATH));
    
    // Ensure config exists
    if (!data.config) {
        data.config = DEFAULT_CONFIG;
    }
    
    return data;
}

// ================================
// 🔹 Save database
// ================================
function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ================================
// 🔹 Reset limit setiap jam 00:00
// ================================
function resetDailyLimit(db) {
    const today = new Date().setHours(0, 0, 0, 0);

    if (db.lastReset !== today) {
        console.log('[LIMIT] Daily limit reset triggered at', new Date().toLocaleString());
        
        // Reset semua user (preserve structure)
        for (const userId in db.users) {
            db.users[userId].used = 0;
            db.users[userId].remaining = db.users[userId].max || db.config.dailyLimit;
        }
        
        db.lastReset = today;
        saveDB(db);
    }
}

// ================================
// 🔹 Get atau initialize user data
// ================================
function getUserData(db, userId) {
    if (!db.users[userId]) {
        const maxLimit = global.defaultLimits?.user || db.config.dailyLimit;
        
        db.users[userId] = {
            used: 0,
            remaining: maxLimit,
            max: maxLimit,
            isPremium: false,
            lastUpdated: Date.now()
        };
    }
    
    return db.users[userId];
}

// ================================
// 🔥 getLimit() → Ambil sisa limit (REMAINING)
// ================================
export function getLimit(userId) {
    const db = loadDB();
    resetDailyLimit(db);
    
    const userData = getUserData(db, userId);
    
    // Return remaining limit, bukan used!
    return userData.remaining;
}

// ================================
// 🔥 getLimitInfo() → Ambil info lengkap
// ================================
export function getLimitInfo(userId) {
    const db = loadDB();
    resetDailyLimit(db);
    
    const userData = getUserData(db, userId);
    
    return {
        used: userData.used,
        remaining: userData.remaining,
        max: userData.max,
        isPremium: userData.isPremium || false,
        percentage: Math.round((userData.used / userData.max) * 100),
        lastUpdated: userData.lastUpdated
    };
}

// ================================
// 🔥 consumeLimit() → Kurangi limit
// ================================
export function consumeLimit(userId, cost = 1) {
    const db = loadDB();
    resetDailyLimit(db);
    
    const userData = getUserData(db, userId);
    
    // Validasi apakah limit cukup
    if (userData.remaining < cost) {
        console.warn(`[LIMIT] Insufficient limit for ${userId}: ${userData.remaining} < ${cost}`);
        return false;
    }
    
    // Kurangi limit
    userData.used += cost;
    userData.remaining -= cost;
    userData.lastUpdated = Date.now();
    
    saveDB(db);
    
    console.log(`[LIMIT] ${userId} consumed ${cost}, remaining: ${userData.remaining}/${userData.max}`);
    return true;
}

// ================================
// 🔥 addLimit() → Tambah limit (reward/premium)
// ================================
export function addLimit(userId, amount = 1) {
    const db = loadDB();
    resetDailyLimit(db);
    
    const userData = getUserData(db, userId);
    
    userData.remaining += amount;
    userData.max += amount;
    userData.lastUpdated = Date.now();
    
    saveDB(db);
    
    console.log(`[LIMIT] ${userId} added ${amount}, remaining: ${userData.remaining}/${userData.max}`);
    return true;
}

// ================================
// 🔥 setPremium() → Set status premium
// ================================
export function setPremium(userId, isPremium = true) {
    const db = loadDB();
    resetDailyLimit(db);
    
    const userData = getUserData(db, userId);
    
    userData.isPremium = isPremium;
    
    // Update max limit
    const baseLimit = global.defaultLimits?.user || db.config.dailyLimit;
    userData.max = isPremium ? baseLimit * db.config.premiumMultiplier : baseLimit;
    
    // Adjust remaining (jika lebih kecil dari max baru)
    if (userData.remaining < userData.max - userData.used) {
        userData.remaining = userData.max - userData.used;
    }
    
    userData.lastUpdated = Date.now();
    
    saveDB(db);
    
    console.log(`[LIMIT] ${userId} premium status: ${isPremium}, max: ${userData.max}`);
    return true;
}

// ================================
// 🔥 resetLimit() → Reset limit user tertentu
// ================================
export function resetLimit(userId) {
    const db = loadDB();
    
    if (db.users[userId]) {
        const userData = db.users[userId];
        userData.used = 0;
        userData.remaining = userData.max;
        userData.lastUpdated = Date.now();
        
        saveDB(db);
        
        console.log(`[LIMIT] ${userId} limit reset manually`);
        return true;
    }
    
    return false;
}

// ================================
// 🔥 getAllLimits() → Get semua data limit (untuk admin)
// ================================
export function getAllLimits() {
    const db = loadDB();
    resetDailyLimit(db);
    
    const result = {};
    
    for (const userId in db.users) {
        result[userId] = {
            ...db.users[userId]
        };
    }
    
    return result;
}

// ================================
// 🔥 getTopUsers() → Get top users by usage
// ================================
export function getTopUsers(limit = 10) {
    const db = loadDB();
    resetDailyLimit(db);
    
    const users = Object.entries(db.users)
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.used - a.used)
        .slice(0, limit);
    
    return users;
}

// ================================
// 🔥 clearAllLimits() → Clear semua data (maintenance)
// ================================
export function clearAllLimits() {
    const db = loadDB();
    db.users = {};
    db.lastReset = new Date().setHours(0, 0, 0, 0);
    saveDB(db);
    
    console.log('[LIMIT] All limits cleared');
    return true;
}

// ================================
// 🔥 updateConfig() → Update konfigurasi
// ================================
export function updateConfig(newConfig) {
    const db = loadDB();
    
    db.config = {
        ...db.config,
        ...newConfig
    };
    
    saveDB(db);
    
    console.log('[LIMIT] Config updated:', db.config);
    return db.config;
}

// ================================
// 🔥 getConfig() → Get konfigurasi
// ================================
export function getConfig() {
    const db = loadDB();
    return db.config;
}

// ================================
// 🔥 getLimitStats() → Get statistik global
// ================================
export function getLimitStats() {
    const db = loadDB();
    resetDailyLimit(db);
    
    let totalUsers = 0;
    let totalUsed = 0;
    let totalRemaining = 0;
    let premiumUsers = 0;
    
    for (const userId in db.users) {
        const user = db.users[userId];
        totalUsers++;
        totalUsed += user.used;
        totalRemaining += user.remaining;
        if (user.isPremium) premiumUsers++;
    }
    
    return {
        totalUsers,
        totalUsed,
        totalRemaining,
        premiumUsers,
        regularUsers: totalUsers - premiumUsers,
        averageUsed: totalUsers > 0 ? Math.round(totalUsed / totalUsers) : 0,
        lastReset: db.lastReset
    };
}

// ================================
// 🔥 forceResetAll() → Force reset semua limit (emergency)
// ================================
export function forceResetAll() {
    const db = loadDB();
    
    for (const userId in db.users) {
        db.users[userId].used = 0;
        db.users[userId].remaining = db.users[userId].max;
    }
    
    db.lastReset = new Date().setHours(0, 0, 0, 0);
    saveDB(db);
    
    console.log('[LIMIT] Force reset all limits');
    return true;
}

// ================================
// 🔥 removeUser() → Hapus user dari database
// ================================
export function removeUser(userId) {
    const db = loadDB();
    
    if (db.users[userId]) {
        delete db.users[userId];
        saveDB(db);
        console.log(`[LIMIT] User ${userId} removed`);
        return true;
    }
    
    return false;
}

// ================================
// DEPRECATED: Backward compatibility
// ================================
export function getUsedLimit(userId) {
    console.warn('[DEPRECATED] getUsedLimit() is deprecated, use getLimitInfo() instead');
    const info = getLimitInfo(userId);
    return info.used;
}

// ================================
// 🔥 Export default untuk backward compatibility
// ================================
export default {
    getLimit,
    getLimitInfo,
    consumeLimit,
    addLimit,
    setPremium,
    resetLimit,
    getAllLimits,
    getTopUsers,
    clearAllLimits,
    updateConfig,
    getConfig,
    getLimitStats,
    forceResetAll,
    removeUser,
    getUsedLimit // deprecated
};
