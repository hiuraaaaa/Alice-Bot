import { consumeLimit, getLimit, getLimitInfo } from './lib/limitUtils.js';
import { getCooldown, setCooldown } from './lib/cooldownUtils.js';
import { checkSpam, getAntiSpamConfig } from './lib/antiSpamUtils.js';
import { trackCommand } from './lib/analyticsUtils.js';
import { acquireLock, releaseLock } from './lib/lockUtils.js';

function normalizeSenderId(sender) {
    return sender.split("@")[0].replace(/\D/g, "");
}

function isPremiumUser(senderId) {
    if (!global.premium) global.premium = [];
    const formattedPremium = global.premium.map(p => p.toString().replace(/\D/g, ""));
    return formattedPremium.includes(senderId);
}

export default async function handler(opts) {
    const { msg, sock, body, from, args, text, commandText, isCmd, sender } = opts;

    const senderId = normalizeSenderId(sender);
    const formattedOwners = global.owner.map(o => o.replace(/\D/g, ""));
    const isOwner = formattedOwners.includes(senderId);
    const isPremium = isPremiumUser(senderId);
    const isGroup = from.endsWith('@g.us');

    const reply = (teks, options = {}) => sock.sendMessage(from, { text: teks, ...options }, { quoted: msg });

    if (!global.isPublic && !isOwner) return;

    // ✅ ANTI-SPAM CHECK (sebelum lock)
    if (!isPremium && !isOwner) {
        const spamCheck = checkSpam(senderId, isOwner);

        console.log(`[HANDLER] Spam check ${senderId}:`, spamCheck);

        if (spamCheck.isBanned) {
            const remaining = spamCheck.remainingTime || 0;
            console.log(`[HANDLER] 🚫 Blocked banned user: ${senderId}`);
            return reply(
                `🚫 *Kamu telah di-BAN* karena spam!\n\n` +
                `⏳ Sisa waktu: ${remaining} detik\n\n` +
                `Hubungi owner jika ini kesalahan.`
            );
        }

        if (spamCheck.isSpam) {
            const { warnings, remainingTime, willBan } = spamCheck;
            const config = getAntiSpamConfig();

            console.log(`[HANDLER] ⚠️ Spam detected: ${senderId} (${warnings}x)`);

            if (willBan) {
                return reply(
                    `🚫 *KAMU DI-BAN!*\n\n` +
                    `Alasan: Spam berlebihan (${warnings}x warning)\n` +
                    `Durasi: ${config.banDuration / 60000} menit`
                );
            }

            return reply(
                `⚠️ *SPAM TERDETEKSI!*\n\n` +
                `⚠️ Warning: ${warnings}/${config.warnLimit}\n` +
                `⏳ Tunggu ${remainingTime} detik sebelum kirim pesan lagi`
            );
        }
    }

    const lockAcquired = await acquireLock(senderId, 3000);
    if (!lockAcquired) {
        console.warn(`[LOCK FAILED] ${senderId} - Message dropped`);
        return;
    }

    try {
        const toRegex = (cmd) => {
            if (!cmd) return null;
            if (cmd instanceof RegExp) return cmd;
            if (typeof cmd === 'string') return new RegExp(`^${cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            if (Array.isArray(cmd)) {
                const validCmds = cmd.filter(c => c && (typeof c === 'string' || c instanceof RegExp));
                if (validCmds.length === 0) return null;
                return new RegExp(`^(${validCmds.map(c => typeof c === 'string' ? c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : c.source).join('|')})$`, 'i');
            }
            return null;
        };

        for (const fileName in global.plugins) {
            const plugin = global.plugins[fileName];
            if (!plugin) continue;

            const pluginName = plugin.name || fileName.replace('.js', '');

            // ✅ Plugin 'all' jalan untuk SEMUA pesan
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all(msg, { 
                        sock, 
                        reply, 
                        sender, 
                        from, 
                        body, 
                        isOwner, 
                        isPremium, 
                        isCmd, 
                        args, 
                        text, 
                        commandText 
                    });
                } catch(e) {
                    console.error(`[PLUGIN ALL ERROR] ${pluginName}:`, e);
                }
            }

            // ✅ Command matching
            if (!plugin.command) continue;
            
            const shouldSkipPrefixCheck = plugin.noPrefix === true;
            
            if (!isCmd && !shouldSkipPrefixCheck) continue;

            const cmdRegex = toRegex(plugin.command);
            
            let matched = false;
            if (shouldSkipPrefixCheck) {
                const firstWord = body.trim().split(/\s+/)[0].toLowerCase();
                matched = cmdRegex && cmdRegex.test(firstWord);
            } else {
                matched = cmdRegex && cmdRegex.test(commandText);
            }
            
            if (!matched) continue;

            // ✅ PERMISSION CHECKS
            if (plugin.owner && !isOwner) {
                trackCommand(pluginName, 'failed', 'Access denied: owner only');
                return reply(global.mess.owner);
            }

            if (plugin.premium && !isPremium && !isOwner) {
                trackCommand(pluginName, 'failed', 'Access denied: premium only');
                return reply(
                    `👑 *PREMIUM ONLY*\n\n` +
                    `Perintah ini hanya untuk user premium.\n\n` +
                    `💎 Upgrade ke premium untuk akses unlimited!\n` +
                    `Hubungi owner untuk info lebih lanjut.`
                );
            }

            if (plugin.group && !isGroup) {
                trackCommand(pluginName, 'failed', 'Access denied: group only');
                return reply(global.mess.group);
            }

            if (plugin.private && isGroup) {
                trackCommand(pluginName, 'failed', 'Access denied: private only');
                return reply(global.mess.private);
            }

            // ✅ ADMIN CHECKS
            if ((plugin.admin || plugin.botAdmin) && isGroup) {
                const metadata = await sock.groupMetadata(from).catch((err) => {
                    console.error(`[GROUP METADATA ERROR] ${pluginName}:`, err);
                    return null;
                });
                
                if (!metadata) {
                    trackCommand(pluginName, 'error', 'Failed to fetch group metadata');
                    return reply('❌ Gagal mengambil data grup.');
                }
                
                const admins = metadata.participants?.filter(p => p.admin)?.map(p => p.id) || [];
                
                if (plugin.admin && !admins.includes(sender)) {
                    trackCommand(pluginName, 'failed', 'Access denied: admin only');
                    return reply(global.mess.admin);
                }
                
                if (plugin.botAdmin) {
                    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    if (!admins.includes(botNumber)) {
                        trackCommand(pluginName, 'failed', 'Bot not admin');
                        return reply(global.mess.botAdmin);
                    }
                }
            } else if ((plugin.admin || plugin.botAdmin) && !isGroup) {
                trackCommand(pluginName, 'failed', 'Admin command used in private chat');
                return reply('❌ Perintah ini hanya bisa digunakan di grup.');
            }

            // ✅ LIMIT CHECK
            if (plugin.limit && !isOwner && !isPremium) {
                const userLimit = getLimit(senderId);
                const limitInfo = getLimitInfo(senderId);
                
                if (userLimit < plugin.limit) {
                    trackCommand(pluginName, 'failed', 'Insufficient limit');
                    return reply(
                        `❌ *Limit tidak cukup!*\n\n` +
                        `⚡ Dibutuhkan: *${plugin.limit}*\n\n` +
                        `💡 *Limit Harian Kamu*\n` +
                        `├ Used: ${limitInfo.used}\n` +
                        `├ Remaining: ${limitInfo.remaining}\n` +
                        `└ Max: ${limitInfo.max}\n\n` +
                        `💎 *Upgrade Premium untuk unlimited limit!*\n` +
                        `Hubungi owner untuk info lebih lanjut.`
                    );
                }
            }

            // ✅ COOLDOWN CHECK
            if (plugin.cooldown && !isOwner) {
                const last = getCooldown(senderId, pluginName);
                const now = Date.now();
                const effectiveCooldown = isPremium ? Math.floor(plugin.cooldown * 0.5) : plugin.cooldown;
                
                if (now - last < effectiveCooldown) {
                    const sisa = Math.ceil((effectiveCooldown - (now - last)) / 1000);
                    trackCommand(pluginName, 'failed', 'Cooldown active');
                    return reply(
                        `⏳ Tunggu *${sisa} detik* lagi sebelum menggunakan perintah ini.` +
                        (isPremium ? ' 👑' : '\n\n💎 Premium users mendapat cooldown 50% lebih cepat!')
                    );
                }
            }

            // ✅ EXECUTE PLUGIN
            let executionSuccess = false;
            let shouldConsume = true;
            
            try {
                const result = await plugin(msg, { 
                    sock, 
                    reply, 
                    args, 
                    text, 
                    command: commandText, 
                    sender, 
                    from, 
                    isOwner,
                    isPremium
                });

                if (result === false) shouldConsume = false;
                
                executionSuccess = true;
                trackCommand(pluginName, 'success', isPremium ? 'premium' : 'regular');

            } catch(e) {
                console.error(`[PLUGIN ERROR] ${pluginName}:`, e);
                trackCommand(pluginName, 'error', e.message || 'Unknown error');
                reply("❌ Terjadi error saat menjalankan perintah.");
                executionSuccess = false;
            }

            // ✅ POST-EXECUTION: Consume limit & set cooldown
            if (executionSuccess) {
                if (plugin.limit && !isOwner && !isPremium && shouldConsume) {
                    const consumed = consumeLimit(senderId, plugin.limit);
                    if (!consumed) {
                        console.error(`[LIMIT ERROR] Failed to consume limit for ${senderId}`);
                    }
                }

                if (plugin.cooldown && !isOwner) {
                    setCooldown(senderId, pluginName, Date.now());
                }
            }

            break;
        }
        
    } finally {
        releaseLock(senderId);
    }
}
