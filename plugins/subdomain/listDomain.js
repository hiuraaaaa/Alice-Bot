const listDomainHandler = async (m, { sock }) => {
    try {
        // Ambil config dari global
        const apiToken = global.cf_token || "1rCsYpw2zFo18tBwH9rpUns2IeVdwwSdTpcapaNg";
        const accountId = global.cf_accountId || "80cc047b71ef2637db4a54c8cce572e9";
        const thumbnail = global.thumb_dns || "http://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/hiurah.jpg";

        await sock.sendMessage(m.key.remoteJid, { 
            text: `╭────────────────────╮
│  🔍 MEMUAT DATA    │
╰────────────────────╯

⏳ Mengambil daftar domain...
🌐 Cloudflare API

_Mohon tunggu sebentar..._` 
        }, { quoted: m });
        
        // Ambil semua zones (domains)
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
                text: `╭─────────────────────╮
│  ❌ KONEKSI GAGAL   │
╰─────────────────────╯

⚠️ Tidak dapat menghubungi Cloudflare!

📊 Status: ${zonesRes.status} ${zonesRes.statusText}

🔧 Periksa koneksi internet Anda.` 
            }, { quoted: m });
        }

        const zonesData = await zonesRes.json();

        console.log('Zones Response:', JSON.stringify(zonesData, null, 2));

        if (!zonesData.success) {
            const errorMsg = zonesData.errors?.[0]?.message || 'Gagal mengambil data';
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `╭──────────────────╮
│  ❌ GAGAL!        │
╰──────────────────╯

⚠️ *Tidak Dapat Mengambil Data*

📝 Error: ${errorMsg}

💡 Periksa token dan permission Cloudflare.` 
            }, { quoted: m });
        }

        if (!zonesData.result || zonesData.result.length === 0) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `╭─────────────────────╮
│  📭 BELUM ADA DATA  │
╰─────────────────────╯

🌐 *Belum Ada Domain*

Akun Cloudflare kamu belum memiliki domain yang terdaftar.

💡 Tambahkan domain melalui dashboard Cloudflare.` 
            }, { quoted: m });
        }

        const zones = zonesData.result;

        let teks = `╭──────────────────────────╮
│  🌐 DAFTAR DOMAIN        │
╰──────────────────────────╯

👤 *Account ID:* \`${accountId.substring(0, 16)}...\`
📊 *Total Domain:* ${zones.length}

━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

        zones.forEach((zone, i) => {
            teks += `┏━━━ 📌 DOMAIN ${i + 1} ━━━┓\n`;
            teks += `┃\n`;
            teks += `┣ 🌐 *Nama*\n`;
            teks += `┃  └─ \`${zone.name}\`\n`;
            teks += `┃\n`;
            teks += `┣ 🆔 *Zone ID*\n`;
            teks += `┃  └─ \`${zone.id}\`\n`;
            teks += `┃\n`;
            teks += `┣ 📡 *Status*\n`;
            teks += `┃  └─ ${zone.status === 'active' ? '✅ Aktif' : '⚠️ ' + zone.status}\n`;
            teks += `┃\n`;
            teks += `┣ 🔒 *Plan*\n`;
            teks += `┃  └─ ${zone.plan?.name || 'Free'}\n`;
            
            // Nameservers
            if (zone.name_servers && zone.name_servers.length > 0) {
                teks += `┃\n`;
                teks += `┗ 🌍 *Nameservers*\n`;
                zone.name_servers.forEach((ns, idx) => {
                    const isLast = idx === zone.name_servers.length - 1;
                    teks += `   ${isLast ? '└─' : '├─'} ${ns}\n`;
                });
            } else {
                teks += `┗━━━━━━━━━━━━━━━━━━━\n`;
            }
            
            teks += `\n`;
        });

        teks += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        teks += `💡 *Info:*\n`;
        teks += `Gunakan \`.listsubdo [domain]\` untuk\n`;
        teks += `melihat DNS records per domain\n\n`;
        teks += `_⚡ Powered by Cloudflare API_`;

        await sock.sendMessage(m.key.remoteJid, {
            text: teks,
            contextInfo: {
                externalAdReply: {
                    title: "✅ Cloudflare Domain Manager",
                    body: `${zones.length} domain aktif di akun Cloudflare`,
                    thumbnailUrl: thumbnail,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (err) {
        console.error('ListDomain Handler Error:', err);
        await sock.sendMessage(m.key.remoteJid, { 
            text: `╭──────────────────╮
│  💥 ERROR SERVER  │
╰──────────────────╯

❌ *Terjadi Kesalahan Internal*

📋 *Error Message:*
\`\`\`${err.message}\`\`\`

🔍 *Stack Trace:*
\`\`\`${err.stack?.split('\n').slice(0, 3).join('\n')}\`\`\`

💬 Laporkan ke developer jika terus terjadi.` 
        }, { quoted: m });
    }
};

listDomainHandler.help = ["listdomain"];
listDomainHandler.tags = ["tools"];
listDomainHandler.command = /^(listdomain|listzone|domains)$/i;
listDomainHandler.limit = true;

export default listDomainHandler;