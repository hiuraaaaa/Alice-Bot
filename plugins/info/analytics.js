import { 
    getAnalytics, 
    getPluginStats, 
    getTopPlugins, 
    getWorstPlugins, 
    getGlobalStats,
    resetAnalytics 
} from '../../lib/analyticsUtils.js';

const aliceHandler = async (m, { reply, args, isOwner }) => {
    const subCommand = args[0]?.toLowerCase();

    try {
        if (!subCommand) {
            const stats = getGlobalStats();
            
            let msg = `📊 *GLOBAL ANALYTICS*\n\n`;
            msg += `📈 Total Commands: *${stats.totalCommands}*\n`;
            msg += `✅ Success: *${stats.totalSuccess}* (${stats.globalSuccessRate}%)\n`;
            msg += `❌ Failed: *${stats.totalFailed}*\n`;
            msg += `⚠️ Errors: *${stats.totalErrors}*\n`;
            msg += `🔌 Total Plugins: *${stats.totalPlugins}*\n\n`;
            msg += `📅 Start Date: ${new Date(stats.startDate).toLocaleString('id-ID')}\n`;
            msg += `🔄 Last Reset: ${new Date(stats.lastReset).toLocaleString('id-ID')}\n\n`;
            msg += `💡 *Commands:*\n`;
            msg += `• ${global.prefix}analytics top - Top plugins\n`;
            msg += `• ${global.prefix}analytics worst - Worst plugins\n`;
            msg += `• ${global.prefix}analytics <plugin> - Detail plugin\n`;
            if (isOwner) msg += `• ${global.prefix}analytics reset - Reset semua data`;
            
            return reply(msg);
        }

        if (subCommand === 'top') {
            const topPlugins = getTopPlugins(10);
            
            if (topPlugins.length === 0) {
                return reply('📊 Belum ada data plugin dengan minimal 5 penggunaan.');
            }
            
            let msg = `🏆 *TOP 10 PLUGINS*\n`;
            msg += `(Min. 5 penggunaan)\n\n`;
            
            topPlugins.forEach((p, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                msg += `${medal} *${p.name}*\n`;
                msg += `   ✅ Success Rate: ${p.successRate}%\n`;
                msg += `   📊 Calls: ${p.totalCalls} | ✓${p.success} | ✗${p.failed} | ⚠${p.errors}\n\n`;
            });
            
            return reply(msg);
        }

        if (subCommand === 'worst') {
            const worstPlugins = getWorstPlugins(10);
            
            if (worstPlugins.length === 0) {
                return reply('📊 Belum ada data plugin dengan minimal 5 penggunaan.');
            }
            
            let msg = `⚠️ *WORST 10 PLUGINS*\n`;
            msg += `(Min. 5 penggunaan)\n\n`;
            
            worstPlugins.forEach((p, i) => {
                msg += `${i + 1}. *${p.name}*\n`;
                msg += `   ❌ Success Rate: ${p.successRate}%\n`;
                msg += `   📊 Calls: ${p.totalCalls} | ✓${p.success} | ✗${p.failed} | ⚠${p.errors}\n\n`;
            });
            
            msg += `💡 Plugin dengan success rate rendah perlu diperbaiki!`;
            
            return reply(msg);
        }

        if (subCommand === 'reset') {
            if (!isOwner) {
                return reply(global.mess.owner);
            }
            
            resetAnalytics();
            return reply('✅ *Analytics data berhasil direset!*\n\nSemua statistik telah dikembalikan ke 0.');
        }

        const pluginStats = getPluginStats(subCommand);
        
        if (!pluginStats) {
            return reply(`❌ Plugin *${subCommand}* belum pernah digunakan atau tidak ditemukan.`);
        }
        
        let msg = `📊 *ANALYTICS: ${pluginStats.name}*\n\n`;
        msg += `📈 Success Rate: *${pluginStats.successRate}%*\n\n`;
        msg += `📊 *Statistics:*\n`;
        msg += `• Total Calls: ${pluginStats.totalCalls}\n`;
        msg += `• ✅ Success: ${pluginStats.success}\n`;
        msg += `• ❌ Failed: ${pluginStats.failed}\n`;
        msg += `• ⚠️ Errors: ${pluginStats.errors}\n\n`;
        
        if (pluginStats.lastUsed) {
            msg += `🕒 Last Used: ${new Date(pluginStats.lastUsed).toLocaleString('id-ID')}\n\n`;
        }
        
        if (isOwner && pluginStats.errorLogs && pluginStats.errorLogs.length > 0) {
            msg += `⚠️ *Recent Errors:*\n`;
            pluginStats.errorLogs.slice(0, 5).forEach((log, i) => {
                const time = new Date(log.timestamp).toLocaleString('id-ID', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                msg += `${i + 1}. [${time}] ${log.message.substring(0, 50)}...\n`;
            });
        }
        
        return reply(msg);

    } catch (err) {
        console.error(err);
        return reply('❌ Terjadi kesalahan saat mengambil data analytics.');
    }
};

aliceHandler.help = ["analytics", "stats"];
aliceHandler.tags = ["info"];
aliceHandler.command = /^(analytics|stats|statistics)$/i;
aliceHandler.owner = false;
aliceHandler.limit = false;

export default aliceHandler;
