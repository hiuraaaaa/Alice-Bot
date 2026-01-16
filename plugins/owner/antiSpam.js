import { 
    checkSpam, 
    getAntiSpamConfig, 
    updateAntiSpamConfig,
    banUser,
    unbanUser,
    isBanned,
    getBannedUsers,
    resetWarnings,
    getWarnings,
    getSpamStats
} from '../../lib/antiSpamUtils.js';

const aliceHandler = async (m, { args, reply, isOwner, sender }) => {
    if (!isOwner) return reply(global.mess.owner);

    const cmd = args[0]?.toLowerCase();
    
    if (!cmd) {
        const config = getAntiSpamConfig();
        const stats = getSpamStats();
        
        return reply(
            `*🛡️ ANTI-SPAM SYSTEM*\n\n` +
            `*Status:* ${config.enabled ? '✅ Aktif' : '❌ Nonaktif'}\n` +
            `*Max Pesan:* ${config.maxMessages} pesan\n` +
            `*Time Window:* ${config.timeWindow / 1000} detik\n` +
            `*Warn Limit:* ${config.warnLimit}x warning\n` +
            `*Ban Duration:* ${config.banDuration / 60000} menit\n` +
            `*Auto Unban:* ${config.autoUnban ? 'Ya' : 'Tidak'}\n\n` +
            `*📊 Statistik:*\n` +
            `• Users Tracked: ${stats.totalTracked}\n` +
            `• Users Warned: ${stats.totalWarned}\n` +
            `• Users Banned: ${stats.totalBanned}\n\n` +
            `*📝 Commands:*\n` +
            `• ${global.prefix}antispam on/off\n` +
            `• ${global.prefix}antispam config\n` +
            `• ${global.prefix}antispam ban @user\n` +
            `• ${global.prefix}antispam unban @user\n` +
            `• ${global.prefix}antispam banlist\n` +
            `• ${global.prefix}antispam reset @user\n` +
            `• ${global.prefix}antispam check @user`
        );
    }

    if (cmd === 'on' || cmd === 'off') {
        const enabled = cmd === 'on';
        updateAntiSpamConfig({ enabled });
        return reply(`✅ Anti-spam ${enabled ? '*DIAKTIFKAN*' : '*DINONAKTIFKAN*'}`);
    }

    if (cmd === 'config') {
        const subCmd = args[1]?.toLowerCase();
        const value = parseInt(args[2]);

        if (!subCmd || !value) {
            return reply(
                `*⚙️ KONFIGURASI ANTI-SPAM*\n\n` +
                `Gunakan:\n` +
                `• ${global.prefix}antispam config maxmsg <angka>\n` +
                `• ${global.prefix}antispam config time <detik>\n` +
                `• ${global.prefix}antispam config warn <angka>\n` +
                `• ${global.prefix}antispam config ban <menit>\n` +
                `• ${global.prefix}antispam config autounban on/off\n\n` +
                `Contoh: ${global.prefix}antispam config maxmsg 10`
            );
        }

        if (subCmd === 'maxmsg') {
            updateAntiSpamConfig({ maxMessages: value });
            return reply(`✅ Max pesan diubah menjadi *${value}* pesan`);
        }

        if (subCmd === 'time') {
            updateAntiSpamConfig({ timeWindow: value * 1000 });
            return reply(`✅ Time window diubah menjadi *${value}* detik`);
        }

        if (subCmd === 'warn') {
            updateAntiSpamConfig({ warnLimit: value });
            return reply(`✅ Warn limit diubah menjadi *${value}*x warning`);
        }

        if (subCmd === 'ban') {
            updateAntiSpamConfig({ banDuration: value * 60000 });
            return reply(`✅ Ban duration diubah menjadi *${value}* menit`);
        }

        if (subCmd === 'autounban') {
            const auto = args[2]?.toLowerCase() === 'on';
            updateAntiSpamConfig({ autoUnban: auto });
            return reply(`✅ Auto unban ${auto ? '*DIAKTIFKAN*' : '*DINONAKTIFKAN*'}`);
        }

        return reply('❌ Konfigurasi tidak valid!');
    }

    if (cmd === 'ban') {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) {
            return reply(`❌ Tag user yang ingin di-ban!\n\nContoh: ${global.prefix}antispam ban @user`);
        }

        banUser(mentioned);
        return reply(`✅ User @${mentioned.split('@')[0]} telah di-*BAN*!`, { mentions: [mentioned] });
    }

    if (cmd === 'unban') {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) {
            return reply(`❌ Tag user yang ingin di-unban!\n\nContoh: ${global.prefix}antispam unban @user`);
        }

        if (!isBanned(mentioned)) {
            return reply('❌ User tersebut tidak di-ban!');
        }

        unbanUser(mentioned);
        return reply(`✅ User @${mentioned.split('@')[0]} telah di-*UNBAN*!`, { mentions: [mentioned] });
    }

    if (cmd === 'banlist') {
        const banned = getBannedUsers();
        if (banned.length === 0) {
            return reply('✅ Tidak ada user yang di-ban');
        }

        let list = '*🚫 DAFTAR USER BANNED*\n\n';
        banned.forEach((id, i) => {
            list += `${i + 1}. @${id}\n`;
        });

        const mentions = banned.map(id => `${id}@s.whatsapp.net`);
        return reply(list, { mentions });
    }

    if (cmd === 'reset') {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) {
            return reply(`❌ Tag user yang ingin di-reset!\n\nContoh: ${global.prefix}antispam reset @user`);
        }

        resetWarnings(mentioned);
        return reply(`✅ Warning user @${mentioned.split('@')[0]} telah di-reset!`, { mentions: [mentioned] });
    }

    if (cmd === 'check') {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) {
            return reply(`❌ Tag user yang ingin dicek!\n\nContoh: ${global.prefix}antispam check @user`);
        }

        const warnings = getWarnings(mentioned);
        const banned = isBanned(mentioned);

        return reply(
            `*🔍 STATUS USER*\n\n` +
            `User: @${mentioned.split('@')[0]}\n` +
            `Warning: ${warnings}x\n` +
            `Status: ${banned ? '🚫 Banned' : '✅ Normal'}`,
            { mentions: [mentioned] }
        );
    }

    return reply('❌ Command tidak dikenali!');
};

aliceHandler.help = ["antispam", "as"];
aliceHandler.tags = ["owner"];
aliceHandler.command = /^(antispam|as)$/i;
aliceHandler.owner = true;
aliceHandler.limit = false;

export default aliceHandler;
