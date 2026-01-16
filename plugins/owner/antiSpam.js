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

const antispamHandler = async (m, { args, reply, isOwner, sender }) => {
    if (!isOwner) return reply('❌ Command ini hanya untuk Owner!');

    const cmd = args[0]?.toLowerCase();
    
    if (!cmd) {
        const config = getAntiSpamConfig();
        const stats = getSpamStats();
        
        return reply(`*🛡️ ANTI-SPAM SYSTEM*

*Status:* ${config.enabled ? '✅ Aktif' : '❌ Nonaktif'}
*Max Pesan:* ${config.maxMessages} pesan
*Time Window:* ${config.timeWindow / 1000} detik
*Warn Limit:* ${config.warnLimit}x warning
*Ban Duration:* ${config.banDuration / 60000} menit
*Auto Unban:* ${config.autoUnban ? 'Ya' : 'Tidak'}

*📊 Statistik:*
• Users Tracked: ${stats.totalTracked}
• Users Warned: ${stats.totalWarned}
• Users Banned: ${stats.totalBanned}

*📝 Commands:*
• ${global.prefix}antispam on/off
• ${global.prefix}antispam config
• ${global.prefix}antispam ban @user
• ${global.prefix}antispam unban @user
• ${global.prefix}antispam banlist
• ${global.prefix}antispam reset @user
• ${global.prefix}antispam check @user`);
    }

    // ON/OFF
    if (cmd === 'on' || cmd === 'off') {
        const enabled = cmd === 'on';
        updateAntiSpamConfig({ enabled });
        return reply(`✅ Anti-spam ${enabled ? '*DIAKTIFKAN*' : '*DINONAKTIFKAN*'}`);
    }

    // CONFIG
    if (cmd === 'config') {
        const subCmd = args[1]?.toLowerCase();
        const value = parseInt(args[2]);

        if (!subCmd || !value) {
            return reply(`*⚙️ KONFIGURASI ANTI-SPAM*

Gunakan:
• ${global.prefix}antispam config maxmsg <angka>
• ${global.prefix}antispam config time <detik>
• ${global.prefix}antispam config warn <angka>
• ${global.prefix}antispam config ban <menit>
• ${global.prefix}antispam config autounban on/off

Contoh: ${global.prefix}antispam config maxmsg 10`);
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

    // BAN USER
    if (cmd === 'ban') {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) return reply('❌ Tag user yang ingin di-ban!\n\nContoh: .antispam ban @user');

        banUser(mentioned);
        return reply(`✅ User @${mentioned.split('@')[0]} telah di-*BAN*!`, { mentions: [mentioned] });
    }

    // UNBAN USER
    if (cmd === 'unban') {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) return reply('❌ Tag user yang ingin di-unban!\n\nContoh: .antispam unban @user');

        if (!isBanned(mentioned)) {
            return reply('❌ User tersebut tidak di-ban!');
        }

        unbanUser(mentioned);
        return reply(`✅ User @${mentioned.split('@')[0]} telah di-*UNBAN*!`, { mentions: [mentioned] });
    }

    // BANLIST
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

    // RESET WARNING
    if (cmd === 'reset') {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) return reply('❌ Tag user yang ingin di-reset!\n\nContoh: .antispam reset @user');

        resetWarnings(mentioned);
        return reply(`✅ Warning user @${mentioned.split('@')[0]} telah di-reset!`, { mentions: [mentioned] });
    }

    // CHECK USER
    if (cmd === 'check') {
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) return reply('❌ Tag user yang ingin dicek!\n\nContoh: .antispam check @user');

        const warnings = getWarnings(mentioned);
        const banned = isBanned(mentioned);

        return reply(`*🔍 STATUS USER*

User: @${mentioned.split('@')[0]}
Warning: ${warnings}x
Status: ${banned ? '🚫 Banned' : '✅ Normal'}`, { mentions: [mentioned] });
    }

    return reply('❌ Command tidak dikenali!');
};

antispamHandler.help = ['antispam'];
antispamHandler.tags = ['owner'];
antispamHandler.command = /^(antispam|as)$/i;

export default antispamHandler;