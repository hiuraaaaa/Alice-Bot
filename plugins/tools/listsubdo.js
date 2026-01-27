const listSubdoHandler = async (m, { sock, text }) => {
    try {
        const apiToken = global.cf_token || "1rCsYpw2zFo18tBwH9rpUns2IeVdwwSdTpcapaNg";
        const accountId = global.cf_accountId || "80cc047b71ef2637db4a54c8cce572e9";
        const thumbnail = global.thumb_dns || "http://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/hiurah.jpg";

        await sock.sendMessage(m.key.remoteJid, { 
            text: `🔍 *Mengambil semua DNS records...*` 
        }, { quoted: m });
        
        // STEP 1: Ambil semua domain
        let zonesUrl = `https://api.cloudflare.com/client/v4/zones?per_page=50`;
        if (accountId) {
            zonesUrl += `&account.id=${accountId}`;
        }

        const zonesRes = await fetch(zonesUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!zonesRes.ok) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Gagal menghubungi Cloudflare!*\n\nStatus: ${zonesRes.status} ${zonesRes.statusText}` 
            }, { quoted: m });
        }

        const zonesData = await zonesRes.json();

        if (!zonesData.success || !zonesData.result || zonesData.result.length === 0) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `🌐 *Belum ada domain*\n\nAkun Cloudflare kamu belum memiliki domain yang terdaftar.` 
            }, { quoted: m });
        }

        const zones = zonesData.result;
        
        let allRecords = [];
        let totalRecords = 0;

        // STEP 2: Ambil DNS records dari semua domain
        for (const zone of zones) {
            const dnsRes = await fetch(
                `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?per_page=100`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (dnsRes.ok) {
                const dnsData = await dnsRes.json();
                if (dnsData.success && dnsData.result) {
                    const records = dnsData.result.filter(r => 
                        ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS'].includes(r.type)
                    );
                    
                    allRecords.push({
                        domain: zone.name,
                        zoneId: zone.id,
                        records: records
                    });
                    
                    totalRecords += records.length;
                }
            }
        }

        if (totalRecords === 0) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `🌐 *Belum ada DNS records*\n\nSemua domain belum memiliki subdomain yang terdaftar.` 
            }, { quoted: m });
        }

        // STEP 3: Format output
        let teks = `🌐 *SEMUA DNS RECORDS*\n`;
        teks += `📊 Total: ${totalRecords} records dari ${zones.length} domain\n\n`;
        teks += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        let globalNumber = 0;

        allRecords.forEach(domainData => {
            if (domainData.records.length > 0) {
                teks += `📍 *${domainData.domain.toUpperCase()}*\n`;
                teks += `🆔 \`${domainData.zoneId}\`\n\n`;

                // Group by type
                const grouped = domainData.records.reduce((acc, r) => {
                    if (!acc[r.type]) acc[r.type] = [];
                    acc[r.type].push(r);
                    return acc;
                }, {});

                Object.keys(grouped).forEach(type => {
                    teks += `📂 *${type}* (${grouped[type].length})\n`;
                    
                    grouped[type].forEach(r => {
                        globalNumber++;
                        const recordName = r.name.replace(`.${domainData.domain}`, '') || '@';
                        
                        teks += `  ${globalNumber}. \`${recordName}\`\n`;
                        teks += `     → \`${r.content}\`\n`;
                        
                        if (r.proxied !== undefined) {
                            teks += `     ${r.proxied ? '🔒 Proxied' : '🔓 DNS Only'}\n`;
                        }
                    });
                    teks += `\n`;
                });
                
                teks += `\n`;
            }
        });

        teks += `━━━━━━━━━━━━━━━━━━━━\n`;
        teks += `💡 Hapus record: \`.delsubdo [nomor]\`\n`;
        teks += `_Powered by Cloudflare API_`;

        await sock.sendMessage(m.key.remoteJid, {
            text: teks,
            contextInfo: {
                externalAdReply: {
                    title: "✅ DNS Records Manager",
                    body: `${totalRecords} DNS records dari ${zones.length} domain`,
                    thumbnailUrl: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (err) {
        console.error('ListSubdo Handler Error:', err);
        await sock.sendMessage(m.key.remoteJid, { 
            text: `❌ *Error Server!*\n\n\`\`\`${err.message}\`\`\`` 
        }, { quoted: m });
    }
};

listSubdoHandler.help = ["listsubdo"];
listSubdoHandler.tags = ["tools"];
listSubdoHandler.command = /^(listsubdo|listsubdomain|listdns|list)$/i;
listSubdoHandler.limit = true;

export default listSubdoHandler;