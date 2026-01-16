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
            console.warn(`[LOCK TIMEOUT] ${userId} - Forcing release`);
            releaseLock(userId);
            return false;
        }
    }
    
    // Set lock
    locks.set(userId, true);
    
    // Auto-release setelah timeout (safety mechanism)
    const timeoutId = setTimeout(() => {
        console.warn(`[LOCK AUTO-RELEASE] ${userId}`);
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
    locks.delete(userId);
    
    // Clear timeout
    const timeoutId = lockTimeouts.get(userId);
    if (timeoutId) {
        clearTimeout(timeoutId);
        lockTimeouts.delete(userId);
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
 * Clear semua locks (untuk debugging/maintenance)
 */
export function clearAllLocks() {
    for (const timeoutId of lockTimeouts.values()) {
        clearTimeout(timeoutId);
    }
    locks.clear();
    lockTimeouts.clear();
}
