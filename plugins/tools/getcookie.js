// file: plugins/tools/getcookie.js
import fetch from 'node-fetch';
import { URL } from 'url';

const getCookieHandler = async (m, { sock, text, args, reply }) => {
    try {
        // Cek apakah ada URL yang diberikan
        if (!text) {
            return reply(
                `❌ *Usage:* ${global.prefix[0]}getcookie <url>\n` +
                `📌 *Example:* ${global.prefix[0]}getcookie https://luvyaa.my.id\n\n` +
                `⚡ *Fitur:* Mendapatkan cookies otomatis untuk bypass Cloudflare`
            );
        }

        // Validasi URL
        let url = text.trim();
        
        // Tambahkan https:// jika tidak ada
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        // Validasi format URL
        try {
            new URL(url);
        } catch {
            return reply('❌ *URL tidak valid!* Pastikan format URL benar.\nContoh: https://example.com');
        }

        // Encode URL untuk API
        const encodedUrl = encodeURIComponent(url);
        const apiUrl = `https://fathurweb.qzz.io/api/solver/get-cookies?url=${encodedUrl}`;

        // Kirim pesan loading
        const loadingMsg = await reply('🔄 *Mengambil cookies...*\nTunggu sebentar...');

        // Fetch data dari API
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Cek status response
        if (!data.status || !data.result || data.result.length === 0) {
            return reply('❌ *Gagal mendapatkan cookies!* Website mungkin tidak support atau API sedang bermasalah.');
        }

        // Format cookies untuk ditampilkan
        const cookies = data.result;
        let message = `✅ *COOKIES BERHASIL DIDAPATKAN!*\n\n`;
        message += `🌐 *Website:* ${url}\n`;
        message += `👤 *Creator:* ${data.creator || 'FathurDevs'}\n`;
        message += `📊 *Total Cookies:* ${cookies.length}\n\n`;

        // Tampilkan setiap cookie
        cookies.forEach((cookie, index) => {
            message += `🍪 *Cookie ${index + 1}:* ${cookie.name}\n`;
            message += `🔑 *Value:* \`${cookie.value}\`\n`;
            
            // Format expiry date
            if (cookie.expires) {
                const expiryDate = new Date(cookie.expires * 1000);
                message += `⏰ *Expires:* ${expiryDate.toLocaleString()}\n`;
            }
            
            message += `🔒 *Secure:* ${cookie.secure ? '✅' : '❌'}\n`;
            message += `🌍 *Domain:* ${cookie.domain}\n`;
            
            if (index < cookies.length - 1) {
                message += `────────────────────\n`;
            }
        });

        // Tambahkan usage instructions
        message += `\n📋 *CARA PENGGUNAAN:*\n`;
        message += `• Copy value cookie yang diinginkan\n`;
        message += `• Gunakan di browser/script Anda\n`;
        message += `• Cookie akan otomatis bypass Cloudflare\n\n`;
        message += `⚠️ *PERHATIAN:*\n`;
        message += `• Cookies bersifat pribadi\n`;
        message += `• Jangan bagikan ke orang lain\n`;
        message += `• Expires sesuai waktu yang ditentukan`;

        // Edit pesan loading dengan hasil
        await sock.sendMessage(
            m.key.remoteJid,
            { 
                text: message,
                edit: loadingMsg.key
            },
            { quoted: m }
        );

    } catch (error) {
        console.error('[GETCOOKIE ERROR]:', error);
        
        let errorMessage = '❌ *Terjadi kesalahan!*\n\n';
        
        if (error.message.includes('fetch failed')) {
            errorMessage += 'Tidak bisa terhubung ke API.\nPeriksa koneksi internet Anda.';
        } else if (error.message.includes('API Error')) {
            errorMessage += 'API sedang bermasalah.\nCoba lagi beberapa saat.';
        } else if (error.message.includes('ENOTFOUND')) {
            errorMessage += 'Website tidak ditemukan.\nPeriksa URL yang dimasukkan.';
        } else {
            errorMessage += `Error: ${error.message}`;
        }
        
        await reply(errorMessage);
    }
};

getCookieHandler.help = ["getcookie <url>"];
getCookieHandler.tags = ["tools", "internet"];
getCookieHandler.command = /^(getcookie|cookie|getcookies)$/i;
getCookieHandler.limit = 2;
getCookieHandler.cooldown = 10000; // 10 detik

export default getCookieHandler;