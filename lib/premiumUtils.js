import fs from 'fs/promises';
import path from 'path';

const PREMIUM_PATH = path.join(process.cwd(), 'database/premium.json');

// Track source of each premium user
export const SOURCE = {
    SETTINGS: 'settings',
    DATABASE: 'database'
};

/**
 * Load premium users (async) dan track source
 */
export async function loadPremiumUsers() {
    let filePremium = [];

    try {
        const data = await fs.readFile(PREMIUM_PATH, 'utf-8');
        filePremium = JSON.parse(data);
        if (!Array.isArray(filePremium)) filePremium = [];
    } catch {
        // File belum ada atau corrupt
        filePremium = [];
    }

    const settingsPremium = global.premium || [];
    const allPremium = [...settingsPremium];

    // Tambahkan dari database kalau belum ada
    for (const user of filePremium) {
        const normalized = user.toString().replace(/\D/g, '');
        if (!allPremium.some(p => p.toString().replace(/\D/g, '') === normalized)) {
            allPremium.push(normalized);
        }
    }

    // Update global
    global.premium = allPremium;

    // Track sources
    global.premiumSources = {
        [SOURCE.SETTINGS]: settingsPremium.map(p => p.toString().replace(/\D/g, '')),
        [SOURCE.DATABASE]: filePremium.map(p => p.toString().replace(/\D/g, ''))
    };

    console.log(`[PREMIUM] Loaded ${allPremium.length} users (${settingsPremium.length} settings, ${filePremium.length} database)`);
    return allPremium;
}

/**
 * Save ONLY dynamic (database) premium users
 */
export async function savePremiumUsers() {
    try {
        if (!global.premium || !global.premiumSources) return false;

        const allUsers = global.premium.map(p => p.toString().replace(/\D/g, ''));
        const settingsUsers = global.premiumSources[SOURCE.SETTINGS] || [];

        const dynamicPremium = allUsers.filter(u => !settingsUsers.includes(u));

        await fs.writeFile(PREMIUM_PATH, JSON.stringify(dynamicPremium, null, 2), 'utf-8');
        console.log(`[PREMIUM] Saved ${dynamicPremium.length} dynamic users to database`);
        return true;
    } catch (e) {
        console.error('[PREMIUM] Error saving premium.json:', e);
        return false;
    }
}

/**
 * Add premium user (dynamic only)
 */
export async function addPremiumUser(userId) {
    const normalized = userId.toString().replace(/\D/g, '');
    if (!normalized || normalized.length < 10) return { success: false, message: 'ID user tidak valid!' };

    if (!Array.isArray(global.premium)) await loadPremiumUsers();
    if (!global.premiumSources) global.premiumSources = { [SOURCE.SETTINGS]: [], [SOURCE.DATABASE]: [] };

    if (global.premium.some(p => p.toString().replace(/\D/g, '') === normalized)) {
        return { success: false, message: 'User sudah premium!' };
    }

    global.premium.push(normalized);
    global.premiumSources[SOURCE.DATABASE].push(normalized);
    await savePremiumUsers();

    console.log(`[PREMIUM] Added dynamic user: ${normalized}`);
    return { success: true, message: 'Premium berhasil ditambahkan!', userId: normalized, source: SOURCE.DATABASE };
}

/**
 * Remove premium user
 */
export async function removePremiumUser(userId) {
    const normalized = userId.toString().replace(/\D/g, '');
    if (!Array.isArray(global.premium) || global.premium.length === 0) return { success: false, message: 'Tidak ada premium user!' };

    const index = global.premium.findIndex(p => p.toString().replace(/\D/g, '') === normalized);
    if (index === -1) return { success: false, message: 'User bukan premium!' };

    // Cek jika dari settings → tidak bisa dihapus via command
    if ((global.premiumSources?.[SOURCE.SETTINGS] || []).includes(normalized)) {
        return { success: false, message: 'User premium dari settings.js tidak bisa dihapus via command!' };
    }

    global.premium.splice(index, 1);
    const dbIndex = global.premiumSources[SOURCE.DATABASE]?.indexOf(normalized);
    if (dbIndex > -1) global.premiumSources[SOURCE.DATABASE].splice(dbIndex, 1);

    await savePremiumUsers();
    console.log(`[PREMIUM] Removed dynamic user: ${normalized}`);
    return { success: true, message: 'Premium berhasil dihapus!', userId: normalized };
}

/**
 * Check if user is premium
 */
export function isPremiumUser(userId) {
    const normalized = userId.toString().replace(/\D/g, '');
    return Array.isArray(global.premium) && global.premium.some(p => p.toString().replace(/\D/g, '') === normalized);
}

/**
 * Get all premium users
 */
export function getAllPremiumUsers() {
    return global.premium || [];
}

/**
 * Get premium stats
 */
export function getPremiumStats() {
    const total = global.premium?.length || 0;
    const manual = global.premiumSources?.[SOURCE.SETTINGS]?.length || 0;
    const dynamic = global.premiumSources?.[SOURCE.DATABASE]?.length || 0;
    return { total, manual, dynamic, valid: total === manual + dynamic };
}

/**
 * Get user source
 */
export function getUserSource(userId) {
    const normalized = userId.toString().replace(/\D/g, '');
    if (global.premiumSources?.[SOURCE.SETTINGS]?.includes(normalized)) return SOURCE.SETTINGS;
    if (global.premiumSources?.[SOURCE.DATABASE]?.includes(normalized)) return SOURCE.DATABASE;
    return null;
}

export default {
    loadPremiumUsers,
    savePremiumUsers,
    addPremiumUser,
    removePremiumUser,
    isPremiumUser,
    getAllPremiumUsers,
    getPremiumStats,
    getUserSource,
    SOURCE
}; 
