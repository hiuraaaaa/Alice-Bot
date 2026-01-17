import { getLimit, consumeLimit } from './lib/limitUtils.js';
import { getCooldown, setCooldown } from './lib/cooldownUtils.js';
import { checkSpam } from './lib/antiSpamUtils.js';
import { trackCommand } from './lib/analyticsUtils.js';
import { acquireLock, releaseLock } from './lib/lockUtils.js';
import { logger } from './lib/logger.js';

function normalizeSender(sender) {
    if (!sender || typeof sender !== 'string') return '';
    let cleaned = sender.split('@')[0].replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
    return cleaned;
}

function isOwnerUser(userId) {
    const formattedOwners = (global.owner || []).map(o => o.replace(/\D/g, ''));
    return formattedOwners.includes(userId);
}

function isPremiumUser(userId) {
    const formattedPremium = (global.premium || []).map(p => p.toString().replace(/\D/g, ''));
    return formattedPremium.includes(userId);
}

function toRegex(cmd) {
    if (!cmd) return null;
    if (cmd instanceof RegExp) return cmd;
    if (typeof cmd === 'string') return new RegExp(`^${cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    if (Array.isArray(cmd)) {
        const validCmds = cmd.filter(c => c && (typeof c === 'string' || c instanceof RegExp));
        if (validCmds.length === 0) return null;
        return new RegExp(`^(${validCmds.map(c => typeof c === 'string' ? c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : c.source).join('|')})$`, 'i');
    }
    return null;
}

export default async function handler(opts) {
    const { msg, sock, body, from, args, text, commandText, isCmd, sender } = opts;
    const senderId = normalizeSender(sender);
    if (!senderId) return;

    const isOwner = isOwnerUser(senderId);
    const isPremium = isPremiumUser(senderId);
    const isGroup = from.endsWith('@g.us');

    const reply = (teks, options = {}) => sock.sendMessage(from, { text: teks, ...options }, { quoted: msg });

    if (!global.isPublic && !isOwner) return;

    const lockAcquired = await acquireLock(senderId, 3000);
    if (!lockAcquired) return;

    try {
        // Anti-Spam
        if (!isPremium && !isOwner) {
            const spamCheck = checkSpam(sender, isOwner);
            if (spamCheck.isBanned) return reply(`🚫 *AKUN TERBLOKIR*\nAlasan: ${spamCheck.reason || 'Spam'}`);
            if (spamCheck.isSpam) return reply(`⚠️ *SPAM TERDETEKSI!*\nTunggu ${spamCheck.remainingTime} detik.`);
        }

        // Plugin Processing
        for (const pluginPath in global.plugins) {
            const plugin = global.plugins[pluginPath];
            if (!plugin) continue;

            // All handler
            if (typeof plugin.all === 'function') {
                try { await plugin.all(msg, { sock, reply, sender, senderId, from, body, isOwner, isPremium, isCmd, args, text, commandText }); } catch (e) { logger.error(`Plugin All Error [${pluginPath}]:`, e); }
            }

            if (!plugin.command) continue;
            const isNoPrefix = plugin.noPrefix === true;
            if (!isCmd && !isNoPrefix) continue;

            const cmdRegex = toRegex(plugin.command);
            let matched = isNoPrefix ? cmdRegex.test(body.trim().split(/\s+/)[0]) : cmdRegex.test(commandText);
            if (!matched) continue;

            // Permissions
            if (plugin.owner && !isOwner) return reply(global.mess.owner);
            if (plugin.premium && !isPremium && !isOwner) return reply(global.mess.premium);
            if (plugin.group && !isGroup) return reply(global.mess.group);
            if (plugin.private && isGroup) return reply(global.mess.private);

            // Admin checks
            if ((plugin.admin || plugin.botAdmin) && isGroup) {
                const metadata = await sock.groupMetadata(from);
                const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
                const isBotAdmin = admins.includes(sock.user.id.split(':')[0] + '@s.whatsapp.net');
                const isAdmin = admins.includes(sender);

                if (plugin.botAdmin && !isBotAdmin) return reply(global.mess.botAdmin);
                if (plugin.admin && !isAdmin && !isOwner) return reply(global.mess.admin);
            }

            // Cooldown
            if (!isOwner && !isPremium) {
                const cd = getCooldown(senderId, pluginPath);
                if (cd > 0) return reply(`⏳ Tunggu *${(cd / 1000).toFixed(1)}s* lagi.`);
                setCooldown(senderId, pluginPath, plugin.cooldown || global.cooldownTime);
            }

            // Limit
            if (!isOwner && !isPremium && plugin.limit) {
                const limit = getLimit(senderId);
                if (limit <= 0) return reply(global.mess.limit);
                consumeLimit(senderId, 1);
            }

            // Execute
            try {
                await plugin(msg, { sock, reply, sender, senderId, from, body, isOwner, isPremium, isCmd, args, text, commandText });
                trackCommand(pluginPath, 'success');
            } catch (e) {
                logger.error(`Plugin Error [${pluginPath}]:`, e);
                reply(`❌ Terjadi kesalahan saat menjalankan perintah.`);
                trackCommand(pluginPath, 'error');
            }
            break; // Stop after first match
        }
    } finally {
        releaseLock(senderId);
    }
}
