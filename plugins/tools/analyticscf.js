const analyticsHandler = async (m, { sock, text }) => {
    try {
        if (!text) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ *Format Salah!*\n\n*Gunakan:* .analytics domain\n\n*Contoh:*\n• `.analytics nepuh.web.id`" 
            }, { quoted: m });
        }

        const domainUtama = text.trim().toLowerCase();
        const apiToken = global.cf_token || "1rCsYpw2zFo18tBwH9rpUns2IeVdwwSdTpcapaNg";
        const accountId = global.cf_accountId || "80cc047b71ef2637db4a54c8cce572e9";
        const thumbnail = global.thumb_dns || "http://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/hiurah.jpg";

        await sock.sendMessage(m.key.remoteJid, { 
            text: `📊 *Mengambil analytics untuk* \`${domainUtama}\`...` 
        }, { quoted: m });

        // STEP 1: Cari Zone ID
        let zoneUrl = `https://api.cloudflare.com/client/v4/zones?name=${domainUtama}`;
        if (accountId) {
            zoneUrl += `&account.id=${accountId}`;
        }

        const zoneRes = await fetch(zoneUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!zoneRes.ok) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Gagal menghubungi Cloudflare!*` 
            }, { quoted: m });
        }

        const zoneData = await zoneRes.json();

        if (!zoneData.success || !zoneData.result || zoneData.result.length === 0) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Domain \`${domainUtama}\` tidak ditemukan!*` 
            }, { quoted: m });
        }

        const zoneId = zoneData.result[0].id;

        // STEP 2: Ambil Analytics (24 jam terakhir)
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const analyticsRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=${yesterday.toISOString()}&until=${now.toISOString()}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!analyticsRes.ok) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Gagal mengambil analytics!*\n\nStatus: ${analyticsRes.status}` 
            }, { quoted: m });
        }

        const analyticsData = await analyticsRes.json();

        if (!analyticsData.success) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Gagal!*\n\nError: ${analyticsData.errors?.[0]?.message || 'Unknown'}` 
            }, { quoted: m });
        }

        const result = analyticsData.result;
        const totals = result.totals;
        const timeseries = result.timeseries || [];

        // Format bandwidth
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        };

        // Format number dengan koma
        const formatNumber = (num) => {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        };

        // Hitung cache hit rate
        const cacheHitRate = totals.requests.all > 0 
            ? ((totals.requests.cached / totals.requests.all) * 100).toFixed(2)
            : 0;

        let teks = `📊 *CLOUDFLARE ANALYTICS*\n\n`;
        teks += `🌐 *Domain:* \`${domainUtama}\`\n`;
        teks += `📅 *Period:* Last 24 Hours\n`;
        teks += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        teks += `📈 *Traffic Stats:*\n`;
        teks += `• Total Requests: ${formatNumber(totals.requests.all || 0)}\n`;
        teks += `• Cached: ${formatNumber(totals.requests.cached || 0)}\n`;
        teks += `• Uncached: ${formatNumber(totals.requests.uncached || 0)}\n`;
        teks += `• Cache Hit Rate: ${cacheHitRate}%\n\n`;

        teks += `📦 *Bandwidth:*\n`;
        teks += `• Total: ${formatBytes(totals.bandwidth.all || 0)}\n`;
        teks += `• Cached: ${formatBytes(totals.bandwidth.cached || 0)}\n`;
        teks += `• Uncached: ${formatBytes(totals.bandwidth.uncached || 0)}\n\n`;

        teks += `🔒 *Security:*\n`;
        teks += `• Threats Blocked: ${formatNumber(totals.threats.all || 0)}\n`;
        teks += `• SSL Requests: ${formatNumber(totals.requests.ssl?.encrypted || 0)}\n\n`;

        teks += `📊 *HTTP Status:*\n`;
        const httpStatus = totals.requests.http_status || {};
        teks += `• 2xx (Success): ${formatNumber(httpStatus['200'] || 0)}\n`;
        teks += `• 3xx (Redirect): ${formatNumber(httpStatus['301'] || 0)}\n`;
        teks += `• 4xx (Client Error): ${formatNumber(httpStatus['404'] || 0)}\n`;
        teks += `• 5xx (Server Error): ${formatNumber(httpStatus['500'] || 0)}\n\n`;

        teks += `🌍 *Content Type:*\n`;
        const contentType = totals.requests.content_type || {};
        Object.keys(contentType).slice(0, 5).forEach(type => {
            teks += `• ${type}: ${formatNumber(contentType[type])}\n`;
        });

        teks += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        teks += `💡 *Performance Score:*\n`;
        
        // Simple performance scoring
        let score = 100;
        if (cacheHitRate < 50) score -= 20;
        if (totals.threats.all > 100) score -= 10;
        if (httpStatus['500'] > 10) score -= 15;
        
        const scoreEmoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
        teks += `${scoreEmoji} Score: ${score}/100\n\n`;

        teks += `_Last updated: ${now.toLocaleString('id-ID')}_`;

        await sock.sendMessage(m.key.remoteJid, {
            text: teks,
            contextInfo: {
                externalAdReply: {
                    title: "📊 Cloudflare Analytics",
                    body: `${formatNumber(totals.requests.all)} requests in 24h`,
                    thumbnailUrl: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (err) {
        console.error('Analytics Handler Error:', err);
        await sock.sendMessage(m.key.remoteJid, { 
            text: `❌ *Error Server!*\n\n\`\`\`${err.message}\`\`\`` 
        }, { quoted: m });
    }
};

analyticsHandler.help = ["analyticscf"];
analyticsHandler.tags = ["tools"];
analyticsHandler.command = /^(analyticscf|statscf)$/i;
analyticsHandler.limit = true;

export default analyticsHandler;