const delSubdoHandler = async (m, { sock, text }) => {
    try {
        // Format: .delsubdo nomor
        if (!text) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ *Format Salah!*\n\n*Gunakan:* .delsubdo nomor\n\n*Contoh:*\n`.delsubdo 5`\n\n💡 *Cara pakai:*\n1. Ketik `.listsubdo`\n2. Lihat nomor record yang mau dihapus\n3. Ketik `.delsubdo 5`" 
            }, { quoted: m });
        }

        const nomor = parseInt(text.trim());
        
        if (isNaN(nomor) || nomor < 1) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: "❌ *Nomor tidak valid!*\n\nGunakan nomor urut dari hasil `.listsubdo`" 
            }, { quoted: m });
        }

        const apiToken = global.cf_token || "1rCsYpw2zFo18tBwH9rpUns2IeVdwwSdTpcapaNg";
        const accountId = global.cf_accountId || "80cc047b71ef2637db4a54c8cce572e9";
        const thumbnail = global.thumb_dns || "http://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/hiurah.jpg";

        await sock.sendMessage(m.key.remoteJid, { 
            text: `🔍 *Mencari DNS record nomor ${nomor}...*` 
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
                text: `❌ *Gagal menghubungi Cloudflare!*` 
            }, { quoted: m });
        }

        const zonesData = await zonesRes.json();

        if (!zonesData.success || !zonesData.result || zonesData.result.length === 0) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Tidak ada domain ditemukan!*` 
            }, { quoted: m });
        }

        const zones = zonesData.result;
        
        let allRecords = [];
        let globalNumber = 0;

        // STEP 2: Ambil semua DNS records dan buat index
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
                    
                    records.forEach(record => {
                        globalNumber++;
                        allRecords.push({
                            number: globalNumber,
                            domain: zone.name,
                            zoneId: zone.id,
                            record: record
                        });
                    });
                }
            }
        }

        // STEP 3: Cari record berdasarkan nomor
        const targetRecord = allRecords.find(r => r.number === nomor);

        if (!targetRecord) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Record nomor ${nomor} tidak ditemukan!*\n\nTotal records: ${allRecords.length}\nGunakan \`.listsubdo\` untuk melihat daftar.` 
            }, { quoted: m });
        }

        const { domain, zoneId, record } = targetRecord;
        const recordName = record.name.replace(`.${domain}`, '') || '@';

        // Konfirmasi
        await sock.sendMessage(m.key.remoteJid, { 
            text: `⚠️ *KONFIRMASI HAPUS DNS RECORD*\n\n📊 Nomor: ${nomor}\n🌐 Domain: ${domain}\n📝 Name: \`${recordName}\`\n📂 Type: ${record.type}\n🎯 Target: \`${record.content}\`\n\n⏳ *Menghapus record...*` 
        }, { quoted: m });

        // STEP 4: Hapus DNS Record
        const deleteRes = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record.id}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!deleteRes.ok) {
            return await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Gagal menghapus record!*\n\nStatus: ${deleteRes.status}` 
            }, { quoted: m });
        }

        const deleteData = await deleteRes.json();

        if (deleteData.success) {
            await sock.sendMessage(m.key.remoteJid, {
                text: `✅ *DNS Record Berhasil Dihapus!*\n\n📊 Nomor: ${nomor}\n🌐 Domain: ${domain}\n📝 Name: \`${recordName}\`\n📂 Type: ${record.type}\n🎯 Target: \`${record.content}\`\n\n_Record telah dihapus dari Cloudflare._`,
                contextInfo: {
                    externalAdReply: {
                        title: "✅ DNS Record Deleted",
                        body: `${recordName} dari ${domain} berhasil dihapus`,
                        thumbnailUrl: thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });
        } else {
            const errorMsg = deleteData.errors?.[0]?.message || "Gagal menghapus record";
            
            await sock.sendMessage(m.key.remoteJid, { 
                text: `❌ *Gagal Menghapus!*\n\n*Error:* ${errorMsg}` 
            }, { quoted: m });
        }

    } catch (err) {
        console.error('DelSubdo Handler Error:', err);
        await sock.sendMessage(m.key.remoteJid, { 
            text: `❌ *Error Server!*\n\n\`\`\`${err.message}\`\`\`` 
        }, { quoted: m });
    }
};

delSubdoHandler.help = ["delsubdo"];
delSubdoHandler.tags = ["tools"];
delSubdoHandler.command = /^(delsubdo|del|delete|hapus)$/i;
delSubdoHandler.limit = true;
delSubdoHandler.owner = true; // Hanya owner

export default delSubdoHandler;