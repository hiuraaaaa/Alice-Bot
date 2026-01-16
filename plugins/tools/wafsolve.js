// file: plugins/tools/wafsolve.js
import fetch from 'node-fetch';
import { URL } from 'url';

const wafSolveHandler = async (m, { sock, text, args, reply }) => {
    try {
        if (!text) {
            return reply(
                `🛡️ *WAF SESSION SOLVER*\n\n` +
                `⚡ *Fitur:* Bypass Cloudflare + WAF Protection\n` +
                `📌 *Usage:* ${global.prefix[0]}wafsolve <url>\n\n` +
                `📋 *Example:*\n` +
                `${global.prefix[0]}wafsolve https://anabot.my.id\n` +
                `${global.prefix[0]}wafsolve example.com\n\n` +
                `✨ Mendapatkan cookies + headers lengkap untuk bypass WAF`
            );
        }

        // Parse URL
        let url = text.trim();
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return reply('❌ *URL tidak valid!*\nContoh: https://example.com');
        }

        // Encode URL untuk API
        const encodedUrl = encodeURIComponent(url);
        const apiUrl = `https://fathurweb.qzz.io/api/solver/waf-session?url=${encodedUrl}`;

        // Loading message
        await reply(`🛡️ *Memproses WAF Bypass...*\nTarget: ${url}\nMohon tunggu...`);

        // Fetch from API
        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.status || !data.result) {
            throw new Error('Gagal mendapatkan session WAF');
        }

        const { cookies, headers } = data.result;

        // Format output
        let message = `✅ *WAF SESSION CREATED!*\n\n`;
        message += `🌐 *Website:* ${url}\n`;
        message += `👨‍💻 *Creator:* ${data.creator || 'FathurDevs'}\n`;
        message += `📅 *Generated:* ${new Date().toLocaleString()}\n`;
        message += `🛡️ *Protection:* Cloudflare WAF Bypassed\n\n`;

        // Cookies section
        message += `🍪 *COOKIES (${cookies.length}):*\n`;
        cookies.forEach((cookie, index) => {
            message += `${index + 1}. *${cookie.name}*: \`${cookie.value}\`\n`;
            if (cookie.expires) {
                const expiry = new Date(cookie.expires * 1000);
                message += `   ⏰ Expires: ${expiry.toLocaleString()}\n`;
            }
            message += `   🔒 Secure: ${cookie.secure ? '✅' : '❌'}\n`;
            message += `   🌍 Domain: ${cookie.domain}\n`;
            if (index < cookies.length - 1) message += `\n`;
        });

        message += `\n📋 *HEADERS (${Object.keys(headers).length}):*\n`;
        Object.entries(headers).forEach(([key, value], index, array) => {
            message += `• *${key}:* ${value}\n`;
        });

        // Usage instructions
        message += `\n⚡ *CARA PENGGUNAAN:*\n`;
        message += `1. Copy cookies untuk browser\n`;
        message += `2. Gunakan headers untuk request API\n`;
        message += `3. Session valid untuk beberapa jam\n`;
        message += `4. Gunakan command ${global.prefix[0]}wafproxy untuk auto proxy\n`;
        message += `5. Gunakan ${global.prefix[0]}wafexport untuk format lain\n`;

        message += `\n⚠️ *PERHATIAN:*\n`;
        message += `• Jangan share session ke orang lain\n`;
        message += `• Session akan expired otomatis\n`;
        message += `• Gunakan dengan bijak`;

        // Kirim hasil
        return await reply(message);

    } catch (error) {
        console.error('[WAFSOLVE ERROR]:', error);
        
        let errorMsg = `❌ *WAF Solve Failed!*\n\n`;
        
        if (error.message.includes('ENOTFOUND')) {
            errorMsg += `Website tidak ditemukan atau tidak bisa diakses.\n`;
        } else if (error.message.includes('API Error')) {
            errorMsg += `API sedang bermasalah.\nCoba lagi nanti.\n`;
        } else if (error.message.includes('fetch failed')) {
            errorMsg += `Koneksi internet bermasalah.\n`;
        } else {
            errorMsg += `Error: ${error.message}\n`;
        }
        
        errorMsg += `\n💡 *Tips:*\n`;
        errorMsg += `• Pastikan URL benar\n`;
        errorMsg += `• Cek koneksi internet\n`;
        errorMsg += `• Website mungkin sedang down\n`;
        
        return await reply(errorMsg);
    }
};

wafSolveHandler.help = ["wafsolve <url>"];
wafSolveHandler.tags = ["tools", "security", "developer"];
wafSolveHandler.command = /^(wafsolve|wafsession|cfwaf)$/i;
wafSolveHandler.limit = 3;
wafSolveHandler.cooldown = 15000;

export default wafSolveHandler;