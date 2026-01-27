const subdoHandler = async (m, { sock, text }) => {
    try {
        // Validasi format input: .subdo nama|domain|target
        if (!text || text.split('|').length < 3) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `╭─────────────────╮
│  ⚠️ FORMAT SALAH  │
╰─────────────────╯

📝 *Cara Penggunaan:*
\`.subdo nama|domain|target\`

📌 *Contoh:*
┌─ CNAME Record
│ \`.subdo api|nepuh.web.id|cname.vercel-dns.com\`
│
└─ A Record  
  \`.subdo www|nepuh.web.id|192.168.1.1\`

💡 Tips: Pisahkan dengan karakter | (pipe)` 
            }, { quoted: m });
        }

        let [subdomain, domainUtama, target] = text.split('|').map(v => v.trim());
        
        // Ambil config dari global settings
        const apiToken = global.cf_token;
        const accountId = global.cf_accountId;
        const thumbnail = global.thumb_dns;

        // Validasi token
        if (!apiToken) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `╭──────────────────╮
│  🔐 TOKEN HILANG  │
╰──────────────────╯

❌ Token Cloudflare tidak ditemukan!

💬 Hubungi owner untuk konfigurasi.` 
            }, { quoted: m });
        }

        // Normalisasi input
        domainUtama = domainUtama.toLowerCase();
        subdomain = subdomain.toLowerCase();

        // Loading: Mencari Zone ID
        await sock.sendMessage(m.key.remoteJid, { 
            text: `╭────────────────────╮
│  🔍 MENCARI ZONE   │
╰────────────────────╯

⏳ Memproses domain...
🌐 Domain: \`${domainUtama}\`

_Mohon tunggu sebentar..._` 
        }, { quoted: m });

        // STEP 1: Cari Zone ID otomatis
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
                text: `╭─────────────────────╮
│  ❌ KONEKSI GAGAL   │
╰─────────────────────╯

⚠️ Tidak dapat menghubungi Cloudflare!

📊 Status: ${zoneRes.status} ${zoneRes.statusText}

🔧 Periksa koneksi internet Anda.` 
            }, { quoted: m });
        }

        const zoneData = await zoneRes.json();

        // Debug log
        console.log('Zone Response:', JSON.stringify(zoneData, null, 2));

        if (!zoneData.success || !zoneData.result || zoneData.result.length === 0) {
            const errorMsg = zoneData.errors?.[0]?.message || 'Domain tidak ditemukan';
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `╭──────────────────────╮
│  ❌ DOMAIN TIDAK ADA │
╰──────────────────────╯

🌐 Domain: \`${domainUtama}\`

⚠️ *Kemungkinan Penyebab:*
├─ Domain belum ditambahkan ke Cloudflare
├─ Token tidak memiliki akses
├─ Nama domain salah ketik
└─ Account ID tidak sesuai

📝 Error: ${errorMsg}` 
            }, { quoted: m });
        }

        const zoneId = zoneData.result[0].id;
        
        // Deteksi tipe DNS record otomatis
        const isIP = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(target);
        const type = isIP ? 'A' : 'CNAME';

        // Loading: Membuat DNS Record
        await sock.sendMessage(m.key.remoteJid, { 
            text: `╭─────────────────────╮
│  ⚙️ MEMBUAT RECORD  │
╰─────────────────────╯

📋 *Detail Konfigurasi:*
┌─────────────────
│ 🌐 Host    : \`${subdomain}.${domainUtama}\`
│ 🎯 Target  : \`${target}\`
│ 📂 Type    : \`${type}\`
│ 🆔 Zone ID : \`${zoneId.substring(0, 8)}...\`
└─────────────────

⏳ Sedang memproses...` 
        }, { quoted: m });

        // STEP 2: Buat DNS Record
        const dnsRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: type,
                    name: subdomain,
                    content: target,
                    ttl: 1,
                    proxied: false
                })
            }
        );

        if (!dnsRes.ok) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `╭──────────────────╮
│  ❌ GAGAL BUAT    │
╰──────────────────╯

⚠️ Tidak dapat membuat DNS Record!

📊 Status: ${dnsRes.status} ${dnsRes.statusText}

🔄 Silakan coba lagi.` 
            }, { quoted: m });
        }

        const data = await dnsRes.json();

        // Debug log
        console.log('DNS Response:', JSON.stringify(data, null, 2));

        if (data.success) {
            await sock.sendMessage(m.key.remoteJid, {
                text: `╭────────────────────╮
│  ✅ BERHASIL!      │
╰────────────────────╯

🎉 *Subdomain Berhasil Dibuat*

┏━━━━━ 📋 INFORMASI ━━━━━┓
┃
┣ 🌐 *Host*
┃  └─ \`${subdomain}.${domainUtama}\`
┃
┣ 🎯 *Target*  
┃  └─ \`${target}\`
┃
┣ 📂 *Type*
┃  └─ \`${type}\`
┃
┣ 🆔 *Zone ID*
┃  └─ \`${zoneId}\`
┃
┣ ⏱️ *TTL*
┃  └─ Auto
┃
┗ 🔒 *Proxied*
   └─ Tidak Aktif

━━━━━━━━━━━━━━━━━━━━━

✨ DNS record telah aktif di Cloudflare
⚡ Propagasi membutuhkan waktu 1-5 menit`,
                contextInfo: {
                    externalAdReply: {
                        title: "✅ Cloudflare DNS Manager",
                        body: `Subdomain ${subdomain}.${domainUtama} berhasil dibuat`,
                        thumbnailUrl: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
        } else {
            const errorMsg = data.errors?.[0]?.message || data.errors?.[0]?.error_chain?.[0]?.message || "Gagal membuat DNS record";
            const errorCode = data.errors?.[0]?.code || 'UNKNOWN';
            
            await sock.sendMessage(m.key.remoteJid, { 
                text: `╭──────────────────╮
│  ❌ GAGAL!        │
╰──────────────────╯

⚠️ *Tidak Dapat Membuat DNS Record*

📝 *Error Details:*
┌─────────────────
│ Pesan : ${errorMsg}
│ Code  : ${errorCode}
└─────────────────

💡 *Solusi:*
├─ Pastikan subdomain belum ada
├─ Periksa format target (IP/CNAME)
├─ Cek permission token Cloudflare
└─ Verifikasi quota account Anda` 
            }, { quoted: m });
        }

    } catch (err) {
        console.error('SubDo Handler Error:', err);
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

subdoHandler.help = ["subdo"];
subdoHandler.tags = ["tools"];
subdoHandler.command = /^(subdo|subdomain)$/i;
subdoHandler.limit = true;

export default subdoHandler;