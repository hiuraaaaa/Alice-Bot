const proxyHandler = async (m, { sock, text }) => {
    try {
        // Format: .proxy on|domain|nomor ATAU .proxy off|domain|nomor
        if (!text || !text.includes('|')) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ *Format Salah!*\n\n*Gunakan:* .proxy status|domain|nomor\n\n*Status:* on / off\n\n*Contoh:*\n• `.proxy on|nepuh.web.id|1`\n• `.proxy off|nepuh.web.id|3`\n\n💡 *Tips:*\nGunakan `.listsubdo` untuk lihat nomor record" 
            }, { quoted: m });
        }

        let [status, domainUtama, nomorStr] = text.split('|').map(v => v.trim());
        const nomor = parseInt(nomorStr);

        if (!['on', 'off'].includes(status.toLowerCase())) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ *Status tidak valid!*\n\nGunakan: `on` atau `off`" 
            }, { quoted: m });
        }

        if (isNaN(nomor) || nomor < 1) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ *Nomor tidak valid!*\n\nGunakan nomor urut dari hasil `.listsubdo`" 
            }, { quoted: m });
        }

        const proxied = status.toLowerCase() === 'on';
        const apiToken = global.cf_token || "1rCsYpw2zFo18tBwH9rpUns2IeVdwwSdTpcapaNg";
        const accountId = global.cf_accountId || "80cc047b71ef2637db4a54c8cce572e9";
        const thumbnail = global.thumb_dns || "http://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/hiurah.jpg";

        domainUtama = domainUtama.toLowerCase();

        await sock.sendMessage(m.key.remoteJid, { 
            text: `🔍 *Mencari DNS record nomor ${nomor}...*` 
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

        // STEP 2: Ambil DNS records
        const dnsRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=100`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!dnsRes.ok) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Gagal mengambil DNS records!*` 
            }, { quoted: m });
        }

        const dnsData = await dnsRes.json();

        if (!dnsData.success) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Gagal!*` 
            }, { quoted: m });
        }

        // Filter dan index records
        const records = dnsData.result.filter(r => 
            ['A', 'AAAA', 'CNAME'].includes(r.type)
        );

        if (nomor > records.length) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Record nomor ${nomor} tidak ditemukan!*\n\nTotal records: ${records.length}` 
            }, { quoted: m });
        }

        const targetRecord = records[nomor - 1];
        const recordName = targetRecord.name.replace(`.${domainUtama}`, '') || '@';

        // Cek apakah record support proxy
        if (!['A', 'AAAA', 'CNAME'].includes(targetRecord.type)) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Record type ${targetRecord.type} tidak support proxy!*\n\nHanya A, AAAA, dan CNAME yang bisa di-proxy.` 
            }, { quoted: m });
        }

        // Konfirmasi
        await sock.sendMessage(m.key.remoteJid, { 
            text: `⏳ *${proxied ? 'Enabling' : 'Disabling'} Cloudflare Proxy...*\n\n🌐 Domain: ${domainUtama}\n📝 Record: \`${recordName}\`\n📂 Type: ${targetRecord.type}\n🎯 Target: \`${targetRecord.content}\`` 
        }, { quoted: m });

        // STEP 3: Update proxy status
        const updateRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${targetRecord.id}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    proxied: proxied
                })
            }
        );

        if (!updateRes.ok) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Gagal update proxy status!*\n\nStatus: ${updateRes.status}` 
            }, { quoted: m });
        }

        const updateData = await updateRes.json();

        if (updateData.success) {
            const statusIcon = proxied ? '🟠' : '⚪';
            const statusText = proxied ? 'ENABLED (Proxied)' : 'DISABLED (DNS Only)';
            
            let teks = `✅ *Cloudflare Proxy ${proxied ? 'Enabled' : 'Disabled'}!*\n\n`;
            teks += `${statusIcon} *Status:* ${statusText}\n\n`;
            teks += `🌐 *Domain:* ${domainUtama}\n`;
            teks += `📝 *Record:* \`${recordName}\`\n`;
            teks += `📂 *Type:* ${targetRecord.type}\n`;
            teks += `🎯 *Target:* \`${targetRecord.content}\`\n\n`;
            
            if (proxied) {
                teks += `✨ *Benefits:*\n`;
                teks += `• 🛡️ DDoS Protection\n`;
                teks += `• ⚡ CDN Acceleration\n`;
                teks += `• 🔒 SSL/TLS Encryption\n`;
                teks += `• 📊 Analytics Available\n`;
                teks += `• 🚀 Performance Boost\n\n`;
            } else {
                teks += `⚠️ *Note:*\n`;
                teks += `• Direct DNS (no proxy)\n`;
                teks += `• Real IP exposed\n`;
                teks += `• No Cloudflare protection\n\n`;
            }
            
            teks += `_Changes propagate within 1-5 minutes_`;

            await sock.sendMessage(m.key.remoteJid, {
                text: teks,
                contextInfo: {
                    externalAdReply: {
                        title: `${statusIcon} Proxy ${proxied ? 'Enabled' : 'Disabled'}`,
                        body: `${recordName}.${domainUtama}`,
                        thumbnailUrl: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
        } else {
            const errorMsg = updateData.errors?.[0]?.message || 'Gagal update';
            
            await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Gagal Update!*\n\n*Error:* ${errorMsg}` 
            }, { quoted: m });
        }

    } catch (err) {
        console.error('Proxy Handler Error:', err);
        await sock.sendMessage(m.key.remoteJid, { 
            text: `❌ *Error Server!*\n\n\`\`\`${err.message}\`\`\`` 
        }, { quoted: m });
    }
};

proxyHandler.help = ["proxy"];
proxyHandler.tags = ["tools"];
proxyHandler.command = /^(proxy|orange|cdn)$/i;
proxyHandler.limit = true;

export default proxyHandler;