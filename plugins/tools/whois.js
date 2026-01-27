const whoisHandler = async (m, { sock, text }) => {
    try {
        if (!text) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ *Format Salah!*\n\n*Gunakan:* .whois domain\n\n*Contoh:*\n• `.whois nepuh.web.id`" 
            }, { quoted: m });
        }

        const domain = text.trim().toLowerCase();
        const apiToken = global.cf_token || "1rCsYpw2zFo18tBwH9rpUns2IeVdwwSdTpcapaNg";
        const accountId = global.cf_accountId || "80cc047b71ef2637db4a54c8cce572e9";
        const thumbnail = global.thumb_dns || "http://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/hiurah.jpg";

        await sock.sendMessage(m.key.remoteJid, { 
            text: `🔍 *Mengambil info untuk* \`${domain}\`...` 
        }, { quoted: m });

        // Cek di Cloudflare
        let zoneUrl = `https://api.cloudflare.com/client/v4/zones?name=${domain}`;
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
                text: `❌ *Domain tidak ditemukan di Cloudflare!*\n\nGunakan WHOIS online:\nhttps://who.is/whois/${domain}` 
            }, { quoted: m });
        }

        const zoneData = await zoneRes.json();

        if (!zoneData.success || !zoneData.result || zoneData.result.length === 0) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Domain tidak ada di akun Cloudflare kamu!*\n\nCek WHOIS:\nhttps://who.is/whois/${domain}` 
            }, { quoted: m });
        }

        const zone = zoneData.result[0];
        
        // Format dates
        const formatDate = (dateStr) => {
            if (!dateStr) return 'N/A';
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        let teks = `🌐 *DOMAIN INFORMATION*\n\n`;
        teks += `📍 *Domain:* \`${domain}\`\n`;
        teks += `🆔 *Zone ID:* \`${zone.id}\`\n`;
        teks += `━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        teks += `📊 *Status:*\n`;
        teks += `• Active: ${zone.status === 'active' ? '✅ Yes' : '❌ No'}\n`;
        teks += `• Plan: ${zone.plan?.name || 'Free'}\n`;
        teks += `• Type: ${zone.type || 'Full'}\n\n`;

        teks += `📅 *Dates:*\n`;
        teks += `• Created: ${formatDate(zone.created_on)}\n`;
        teks += `• Modified: ${formatDate(zone.modified_on)}\n\n`;

        if (zone.name_servers && zone.name_servers.length > 0) {
            teks += `🌍 *Cloudflare Nameservers:*\n`;
            zone.name_servers.forEach(ns => {
                teks += `• ${ns}\n`;
            });
            teks += `\n`;
        }

        if (zone.original_name_servers && zone.original_name_servers.length > 0) {
            teks += `📌 *Original Nameservers:*\n`;
            zone.original_name_servers.forEach(ns => {
                teks += `• ${ns}\n`;
            });
            teks += `\n`;
        }

        teks += `🔒 *Security:*\n`;
        teks += `• SSL: ${zone.ssl || 'Unknown'}\n`;
        teks += `• Development Mode: ${zone.development_mode > 0 ? '✅ On' : '❌ Off'}\n\n`;

        teks += `━━━━━━━━━━━━━━━━━━━━\n`;
        teks += `💡 *Quick Actions:*\n`;
        teks += `• DNS Records: \`.listsubdo\`\n`;
        teks += `• Analytics: \`.analytics ${domain}\`\n\n`;
        teks += `📝 *Full WHOIS:*\nhttps://who.is/whois/${domain}`;

        await sock.sendMessage(m.key.remoteJid, {
            text: teks,
            contextInfo: {
                externalAdReply: {
                    title: "🌐 Domain Info",
                    body: `${domain} • ${zone.plan?.name || 'Free'} Plan`,
                    thumbnailUrl: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (err) {
        console.error('WHOIS Handler Error:', err);
        await sock.sendMessage(m.key.remoteJid, { 
            text: `❌ *Error!*\n\n\`\`\`${err.message}\`\`\`\n\n💡 Cek manual:\nhttps://who.is/whois/${text.trim()}` 
        }, { quoted: m });
    }
};

whoisHandler.help = ["whois"];
whoisHandler.tags = ["tools"];
whoisHandler.command = /^(whois|domaininfo|domain)$/i;
whoisHandler.limit = true;

export default whoisHandler;