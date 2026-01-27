/**
 * Simple in-memory lock mechanism untuk prevent race condition
 */

const locks = new Map();
const lockTimeouts = new Map();

/**
 * Acquire lock untuk user
 * @param {string} userId - User ID
 * @param {number} timeout - Max waktu tunggu dalam ms (default: 5000)
 * @returns {Promise<boolean>} - true jika berhasil acquire lock
 */
export async function acquireLock(userId, timeout = 5000) {
    const startTime = Date.now();
    
    while (locks.get(userId)) {
        // Tunggu lock released
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Timeout jika terlalu lama
        if (Date.now() - startTime > timeout) {
            console.warn(`[LOCK TIMEOUT] ${userId} - Forcing release after ${timeout}ms`);
            releaseLock(userId);
            return false;
        }
    }
    
    // Set lock
    locks.set(userId, Date.now()); // ✅ Simpan timestamp untuk tracking
    console.log(`\x1b[36m[LOCK 🔒] Acquired for ${userId}\x1b[0m`); // ✅ Log acquired
    
    // Auto-release setelah timeout (safety mechanism)
    const timeoutId = setTimeout(() => {
        const duration = Date.now() - (locks.get(userId) || Date.now());
        console.warn(`[LOCK AUTO-RELEASE] ${userId} after ${duration}ms (timeout: ${timeout}ms)`);
        releaseLock(userId);
    }, timeout);
    
    lockTimeouts.set(userId, timeoutId);
    
    return true;
}

/**
 * Release lock untuk user
 * @param {string} userId - User ID
 */
export function releaseLock(userId) {
    const lockTime = locks.get(userId);
    const wasLocked = locks.has(userId);
    
    locks.delete(userId);
    
    // Clear timeout
    const timeoutId = lockTimeouts.get(userId);
    if (timeoutId) {
        clearTimeout(timeoutId);
        lockTimeouts.delete(userId);
    }
    
    // ✅ Log release dengan duration
    if (wasLocked && lockTime) {
        const duration = Date.now() - lockTime;
        console.log(`\x1b[32m[LOCK 🔓] Released for ${userId} (held: ${duration}ms)\x1b[0m`);
    }
}

/**
 * Check apakah user sedang locked
 * @param {string} userId - User ID
 * @returns {boolean}
 */
export function isLocked(userId) {
    return locks.has(userId);
}

/**
 * Get lock duration untuk user
 * @param {string} userId - User ID
 * @returns {number|null} - Duration in ms, null if not locked
 */
export function getLockDuration(userId) {
    const lockTime = locks.get(userId);
    if (!lockTime) return null;
    return Date.now() - lockTime;
}

/**
 * Get semua active locks (untuk monitoring)
 * @returns {Object} - Object dengan userId dan duration
 */
export function getActiveLocks() {
    const activeLocks = {};
    const now = Date.now();
    
    for (const [userId, lockTime] of locks.entries()) {
        activeLocks[userId] = now - lockTime;
    }
    
    return activeLocks;
}

/**
 * Clear semua locks (untuk debugging/maintenance)
 */
export function clearAllLocks() {
    const count = locks.size;
    
    for (const timeoutId of lockTimeouts.values()) {
        clearTimeout(timeoutId);
    }
    
    locks.clear();
    lockTimeouts.clear();
    
    if (count > 0) {
        console.warn(`[LOCK CLEAR] Cleared ${count} active lock(s)`);
    }
}

/**
 * Get lock statistics
 * @returns {Object} - Lock statistics
 */
export function getLockStats() {
    return {
        activeLocks: locks.size,
        users: Array.from(locks.keys()),
        oldestLock: locks.size > 0 ? Math.max(...Array.from(locks.values()).map(t => Date.now() - t)) : 0
    };
} 
