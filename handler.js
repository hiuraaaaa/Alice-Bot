import { getLimit, getLimitInfo, consumeLimit } from './lib/limitUtils.js';
import { getCooldown, setCooldown } from './lib/cooldownUtils.js';
import { checkSpam, getAntiSpamConfig } from './lib/antiSpamUtils.js';
import { trackCommand } from './lib/analyticsUtils.js';
import { acquireLock, releaseLock } from './lib/lockUtils.js';

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Normalize sender ID to consistent format
 * @param {string} sender - Raw sender JID
 * @returns {string} Normalized user ID
 */
function normalizeSender(sender) {
    if (!sender || typeof sender !== 'string') return '';
    
    let cleaned = sender.split('@')[0].replace(/\D/g, '');
    
    // Handle Indonesian numbers (08xxx → 628xxx)
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    } else if (!cleaned.startsWith('62') && cleaned.length >= 10) {
        cleaned = '62' + cleaned;
    }
    
    return cleaned;
}

/**
 * Check if user is owner
 * @param {string} userId - Normalized user ID
 * @returns {boolean}
 */
function isOwnerUser(userId) {
    if (!global.owner || !Array.isArray(global.owner)) return false;
    const formattedOwners = global.owner.map(o => o.replace(/\D/g, ''));
    return formattedOwners.includes(userId);
}

/**
 * Check if user is premium (read from global.premium)
 * @param {string} userId - Normalized user ID
 * @returns {boolean}
 */
function isPremiumUser(userId) {
    if (!global.premium || !Array.isArray(global.premium)) return false;
    const formattedPremium = global.premium.map(p => p.toString().replace(/\D/g, ''));
    return formattedPremium.includes(userId);
}

/**
 * Convert command pattern to regex
 * @param {string|RegExp|Array} cmd - Command pattern
 * @returns {RegExp|null}
 */
function toRegex(cmd) {
    if (!cmd) return null;
    if (cmd instanceof RegExp) return cmd;
    
    if (typeof cmd === 'string') {
        return new RegExp(`^${cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }
    
    if (Array.isArray(cmd)) {
        const validCmds = cmd.filter(c => c && (typeof c === 'string' || c instanceof RegExp));
        if (validCmds.length === 0) return null;
        
        return new RegExp(
            `^(${validCmds.map(c => 
                typeof c === 'string' 
                    ? c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') 
                    : c.source
            ).join('|')})$`, 
            'i'
        );
    }
    
    return null;
}

// ================================
// MAIN HANDLER
// ================================

/**
 * Main message handler
 * Processes all incoming messages and routes to appropriate plugins
 */
export default async function handler(opts) {
    const { msg, sock, body, from, args, text, commandText, isCmd, sender } = opts;

    // ================================
    // INITIAL SETUP
    // ================================
    
    // Normalize sender
    const senderId = normalizeSender(sender);
    
    if (!senderId) {
        console.warn('[HANDLER] ⚠️  Invalid sender ID');
        return;
    }
    
    // Check permissions
    const isOwner = isOwnerUser(senderId);
    
    // ✅ OPTIMIZED: Direct check global.premium (sudah di-load oleh index.js)
    // Tidak perlu import isPremiumUser dari utils setiap pesan
    const isPremium = isPremiumUser(senderId);
    
    const isGroup = from.endsWith('@g.us');

    // Reply helper
    const reply = (teks, options = {}) => 
        sock.sendMessage(from, { text: teks, ...options }, { quoted: msg });

    // Check if bot is public
    if (!global.isPublic && !isOwner) {
        return;
    }

    // ================================
    // CONCURRENCY CONTROL
    // ================================
    
    const lockAcquired = await acquireLock(senderId, 3000);
    
    if (!lockAcquired) {
        console.warn(`[HANDLER] ⏳ Concurrent request dropped: ${senderId}`);
        return;
    }

    try {
        // ================================
        // ANTI-SPAM CHECK
        // ======================== ========
        
        if (!isPremium && !isOwner) {
            // ✅ Pass original sender, checkSpam normalizes internally
            const spamCheck = checkSpam(sender, isOwner);

            // Handle banned users
            if (spamCheck.isBanned) {
                const remaining = spamCheck.remainingMinutes;
                const timeText = remaining === '∞' 
                    ? 'permanen' 
                    : `${remaining} menit`;
                
                console.log(`[HANDLER] 🚫 Banned user blocked: ${senderId}`);
                
                return reply(
                    `🚫 *AKUN TERBLOKIR*\n\n` +
                    `Alasan: ${spamCheck.reason || 'Spam berlebihan'}\n` +
                    `Waktu tersisa: ${timeText}\n\n` +
                    `📞 Hubungi owner jika ini kesalahan.`
                );
            }

            // Handle spam detection
            if (spamCheck.isSpam) {
                const { warnings, warnLimit, remainingTime, willBan, severity } = spamCheck;
                const config = getAntiSpamConfig();

                console.warn(
                    `[HANDLER] ⚠️  Spam detected: ${senderId} | ` +
                    `Warns: ${warnings}/${warnLimit} | ` +
                    `Severity: ${severity || 'moderate'}`
                );

                // User will be banned
                if (willBan) {
                    return reply(
                        `🚫 *AKUN DI-BAN!*\n\n` +
                        `⚠️ Warning: ${warnings}/${warnLimit}\n` +
                        `⏱️ Durasi: ${config.banDuration / 60000} menit\n` +
                        `📛 Alasan: Spam berlebihan\n\n` +
                        `Harap tunggu hingga ban berakhir.`
                    );
                }

                // Spam warning
                return reply(
                    `⚠️ *SPAM TERDETEKSI!*\n\n` +
                    `⚠️ Warning: ${warnings}/${warnLimit}\n` +
                    `⏳ Tunggu ${remainingTime} detik\n` +
                    `📊 Pesan terlalu cepat!\n\n` +
                    `${warnings >= warnLimit - 1 ? '⛔ *Hati-hati! 1 warning lagi = BAN!*' : ''}`
                );
            }
        }

        // ================================
        // PLUGIN PROCESSING
        // ================================
        
        for (const fileName in global.plugins) {
            const plugin = global.plugins[fileName];
            
            if (!plugin) continue;

            const pluginName = plugin.name || fileName.replace('.js', '');

            // ========================
            // PLUGIN 'ALL' HANDLER
            // ========================
            // Execute for ALL messages (not just commands)
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all(msg, { 
                        sock, 
                        reply, 
                        sender, 
                        senderId,
                        from, 
                        body, 
                        isOwner, 
                        isPremium, 
                        isCmd, 
                        args, 
                        text, 
                        commandText 
                    });
                } catch (e) {
                    console.error(`[PLUGIN ALL] ❌ ${pluginName}:`, e.message);
                }
            }

            // Skip if no command defined
            if (!plugin.command) continue;
            
            // Check prefix requirement
            const shouldSkipPrefixCheck = plugin.noPrefix === true;
            
            // Skip non-commands if plugin requires prefix
            if (!isCmd && !shouldSkipPrefixCheck) continue;

            // ========================
            // COMMAND MATCHING
            // ========================
            
            const cmdRegex = toRegex(plugin.command);
            let matched = false;

            if (shouldSkipPrefixCheck) {
                // No prefix mode: check first word
                const firstWord = body.trim().split(/\s+/)[0].toLowerCase();
                matched = cmdRegex && cmdRegex.test(firstWord);
            } else {
                // Normal mode: check with prefix
                matched = cmdRegex && cmdRegex.test(commandText);
            }
            
            if (!matched) continue;

            // ========================
            // PERMISSION CHECKS
            // ========================
            
            if (plugin.owner && !isOwner) {
                trackCommand(pluginName, 'failed', 'owner_only');
                return reply(global.mess?.owner || '❌ Perintah khusus owner!');
            }

            if (plugin.premium && !isPremium && !isOwner) {
                trackCommand(pluginName, 'failed', 'premium_only');
                return reply(
                    `👑 *PREMIUM ONLY*\n\n` +
                    `Perintah ini hanya untuk user premium.\n\n` +
                    `💎 Upgrade ke premium untuk akses unlimited!\n` +
                    `📞 Hubungi owner: ${global.owner?.[0] || 'N/A'}`
                );
            }

            if (plugin.group && !isGroup) {
                trackCommand(pluginName, 'failed', 'group_only');
                return reply(global.mess?.group || '❌ Perintah khusus grup!');
            }

            if (plugin.private && isGroup) {
                trackCommand(pluginName, 'failed', 'private_only');
                return reply(global.mess?.private || '❌ Perintah khusus private chat!');
            }

            // ========================
            // GROUP ADMIN CHECKS
            // ========================
            
            if ((plugin.admin || plugin.botAdmin) && isGroup) {
                const metadata = await sock.groupMetadata(from).catch((err) => {
                    console.error(`[GROUP] ❌ Metadata error (${pluginName}):`, err.message);
                    return null;
                });
                
                if (!metadata) {
                    trackCommand(pluginName, 'error', 'metadata_failed');
                    return reply('❌ Gagal mengambil data grup. Coba lagi.');
                }
                
                const admins = metadata.participants
                    ?.filter(p => p.admin)
                    ?.map(p => p.id) || [];
                
                // Check user admin
                if (plugin.admin && !admins.includes(sender)) {
                    trackCommand(pluginName, 'failed', 'admin_only');
                    return reply(global.mess?.admin || '❌ Perintah khusus admin!');
                }
                
                // Check bot admin
                if (plugin.botAdmin) {
                    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    if (!admins.includes(botNumber)) {
                        trackCommand(pluginName, 'failed', 'bot_not_admin');
                        return reply(global.mess?.botAdmin || '❌ Bot harus jadi admin!');
                    }
                }
                
            } else if ((plugin.admin || plugin.botAdmin) && !isGroup) {
                trackCommand(pluginName, 'failed', 'admin_in_private');
                return reply('❌ Perintah admin hanya bisa digunakan di grup.');
            }

            // ========================
            // LIMIT CHECK
            // ========================
            
            if (plugin.limit && !isOwner && !isPremium) {
                const userLimit = await getLimit(senderId);
                const limitInfo = await getLimitInfo(senderId);
                
                if (userLimit < plugin.limit) {
                    trackCommand(pluginName, 'failed', 'insufficient_limit');
                    return reply(
                        `⚡ *LIMIT TIDAK CUKUP!*\n\n` +
                        `📊 *Status Limit Harian:*\n` +
                        `├ Dibutuhkan: ${plugin.limit}\n` +
                        `├ Tersisa: ${limitInfo.remaining}\n` +
                        `├ Terpakai: ${limitInfo.used}\n` +
                        `└ Maximum: ${limitInfo.max}\n\n` +
                        `💎 *Upgrade Premium = Unlimited!*\n` +
                        `📞 Hubungi: ${global.owner?.[0] || 'Owner'}`
                    );
                }
            }

            // ========================
            // COOLDOWN CHECK
            // ========================
            
            if (plugin.cooldown && !isOwner) {
                const lastUse = getCooldown(senderId, pluginName);
                const now = Date.now();
                const cooldown = isPremium 
                    ? Math.floor(plugin.cooldown * 0.5) 
                    : plugin.cooldown;
                
                if (now - lastUse < cooldown) {
                    const remaining = Math.ceil((cooldown - (now - lastUse)) / 1000);
                    trackCommand(pluginName, 'failed', 'cooldown_active');
                    return reply(
                        `⏳ *COOLDOWN AKTIF*\n\n` +
                        `Tunggu *${remaining} detik* lagi\n` +
                        (isPremium 
                            ? '👑 Premium cooldown: 50% lebih cepat!' 
                            : '\n💎 Premium = Cooldown 50% lebih cepat!')
                    );
                }
            }

            // ========================
            // EXECUTE PLUGIN
            // ========================
            
            let executionSuccess = false;
            let shouldConsumeLimit = true;
            
            try {
                console.log(
                    `[CMD] ▶️  ${pluginName} | ` +
                    `User: ${senderId} | ` +
                    `Premium: ${isPremium} | ` +
                    `Owner: ${isOwner}`
                );
                
                const result = await plugin(msg, { 
                    sock, 
                    reply, 
                    args, 
                    text, 
                    command: commandText, 
                    sender,      // Original JID
                    senderId,    // Normalized ID
                    from, 
                    isOwner,
                    isPremium
                });

                // Plugin can return false to skip limit consumption
                if (result === false) {
                    shouldConsumeLimit = false;
                }
                
                executionSuccess = true;
                trackCommand(pluginName, 'success', isPremium ? 'premium' : 'regular');
                console.log(`[CMD] ✅ ${pluginName} executed successfully`);

            } catch (e) {
                console.error(`[CMD] ❌ ${pluginName} error:`, e);
                trackCommand(pluginName, 'error', e.message || 'unknown');
                
                reply(
                    `❌ *TERJADI ERROR*\n\n` +
                    `Plugin: ${pluginName}\n` +
                    `Error: ${e.message || 'Unknown error'}\n\n` +
                    `Silakan hubungi owner jika masalah berlanjut.`
                );
                
                executionSuccess = false;
            }

            // ========================
            // POST-EXECUTION
            // ========================
            
            if (executionSuccess) {
                // Consume limit
                if (plugin.limit && !isOwner && !isPremium && shouldConsumeLimit) {
                    const consumed = await consumeLimit(senderId, plugin.limit);
                    
                    if (!consumed) {
                        console.error(`[LIMIT] ❌ Failed to consume for ${senderId}`);
                    } else {
                        console.log(`[LIMIT] ✅ Consumed ${plugin.limit} for ${senderId}`);
                    }
                }

                // Set cooldown
                if (plugin.cooldown && !isOwner) {
                    setCooldown(senderId, pluginName, Date.now());
                }
            }

            // Stop processing other plugins
            break;
        }
        
    } catch (error) {
        console.error('[HANDLER] ❌ Critical error:', error);
    } finally {
        // Always release lock
        releaseLock(senderId);
    }
        }
