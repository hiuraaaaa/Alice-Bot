const cooldownData = new Map();

/**
 * Ambil cooldown terakhir user + command
 */
export const getCooldown = (userId, command) => {
    const key = `${userId}:${command}`;
    return cooldownData.get(key) || 0;
};

/**
 * Set cooldown user + command ke waktu sekarang
 */
export const setCooldown = (userId, command, timestamp) => {
    const key = `${userId}:${command}`;
    cooldownData.set(key, timestamp);
}; 
