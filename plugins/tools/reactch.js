import fetch from 'node-fetch';

// ⚙️ CONFIG - Ganti dengan token dari https://asitha.top/api-docs
const AUTH_TOKEN = "Bearer 862104dad48ba6f1d7f1e07fbc9eabad9285d8704eb516cbf48f598bfe683b8d"; // ✅ GANTI INI

async function reactToChannel(link, emojis) {
    try {
        const commonHeaders = {
            'Authorization': AUTH_TOKEN,
            'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            'Referer': "https://asitha.top/",
            'Origin': 'https://asitha.top',
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        // Step 1: Solve Cloudflare Turnstile
        const cfBody = new URLSearchParams({
            url: 'https://asitha.top/channel-manager',
            siteKey: '0x4AAAAAACJYx5nt6TnJ_qx9'
        });

        const cfRes = await fetch("https://fathurweb.qzz.io/api/solver/turnstile-min", {
            method: 'POST',
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: cfBody
        });

        const cf = await cfRes.json();

        if (!cf.status) {
            throw new Error('❌ Cloudflare solver failed');
        }

        // Step 2: Get channel metadata
        const metadataRes = await fetch(
            `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/metadata-proxy?url=${encodeURIComponent(link)}`,
            { 
                method: 'GET',
                headers: commonHeaders 
            }
        );

        const metadata = await metadataRes.json();

        if (metadata.preview) {
            metadata.preview = `https://pps.whatsapp.net${metadata.preview}`;
        }

        // Step 3: Get temporary token
        const tempRes = await fetch(
            'https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/user/get-temp-token',
            {
                method: 'POST',
                headers: {
                    ...commonHeaders,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cf_token: cf.result })
            }
        );

        const temp = await tempRes.json();

        // Step 4: Send reaction
        const reactRes = await fetch(
            `https://foreign-marna-sithaunarathnapromax-9a005c2e.koyeb.app/api/channel/react-to-post?apiKey=${temp.token}`,
            {
                method: 'POST',
                headers: {
                    ...commonHeaders,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    post_link: link,
                    reacts: emojis
                })
            }
        );

        const res = await reactRes.json();

        return {
            success: true,
            metadata,
            response: res
        };

    } catch (err) {
        console.error('[CHANNEL REACT ERROR]', err.message);
        return {
            success: false,
            error: err.message
        };
    }
}

const channelReactHandler = async (m, { args, reply, text }) => {
    try {
        // ✅ Validasi input
        if (!text) {
            return await reply(
                `*📣 CHANNEL REACT*\n\n` +
                `Kirim reaksi ke postingan channel WhatsApp\n\n` +
                `*Format:*\n` +
                `channelreact <link> | <emoji>\n\n` +
                `*Contoh:*\n` +
                `channelreact https://whatsapp.com/channel/.../123 | 🦄,🩷,😍\n\n` +
                `*Note:*\n` +
                `• Pisahkan link dan emoji dengan |\n` +
                `• Pisahkan emoji dengan koma\n` +
                `• Max 5 emoji per request`
            );
        }

        // ✅ Parse input
        const parts = text.split('|').map(p => p.trim());
        
        if (parts.length < 2) {
            return await reply(
                `❌ *Format salah!*\n\n` +
                `Gunakan: channelreact <link> | <emoji>\n\n` +
                `Contoh:\n` +
                `channelreact https://whatsapp.com/channel/.../123 | 🦄,🩷`
            );
        }

        const [link, emojis] = parts;

        // ✅ Validasi link
        if (!link.includes('whatsapp.com/channel/')) {
            return await reply('❌ Link channel tidak valid!');
        }

        // ✅ Validasi emoji
        const emojiList = emojis.split(',').map(e => e.trim()).filter(e => e);
        
        if (emojiList.length === 0) {
            return await reply('❌ Minimal 1 emoji diperlukan!');
        }

        if (emojiList.length > 5) {
            return await reply('❌ Maksimal 5 emoji per request!');
        }

        // ✅ Send loading message
        await reply('⏳ Mengirim reaksi ke channel...\n\n_Mohon tunggu, ini mungkin memakan waktu 5-10 detik..._');

        // ✅ Execute reaction
        const result = await reactToChannel(link, emojis);

        if (!result.success) {
            return await reply(
                `❌ *Gagal mengirim reaksi!*\n\n` +
                `Error: ${result.error}\n\n` +
                `Kemungkinan:\n` +
                `• Token API tidak valid\n` +
                `• Link channel salah\n` +
                `• Postingan sudah dihapus\n` +
                `• Coin tidak cukup\n` +
                `• API sedang down\n\n` +
                `_Coba lagi beberapa saat._`
            );
        }

        const { metadata, response } = result;

        // ✅ Success response
        return await reply(
            `✅ *REAKSI BERHASIL DIKIRIM!*\n\n` +
            `*📣 Channel Info:*\n` +
            `• Nama: ${metadata.name || 'Unknown'}\n` +
            `• Followers: ${metadata.followers || 0}\n` +
            `• JID: ${metadata.jid || '-'}\n\n` +
            `*😊 Reaksi:*\n` +
            `${emojis}\n\n` +
            `*💬 Response:*\n` +
            `${response.message || 'Success'}\n` +
            `${response.botResponse || ''}\n\n` +
            `_Credits: Fathur - https://fathurweb.qzz.io/_`
        );

    } catch (err) {
        console.error('[CHANNEL REACT HANDLER ERROR]:', err);
        return await reply(
            `❌ *Terjadi error!*\n\n` +
            `${err.message || 'Unknown error'}\n\n` +
            `Pastikan:\n` +
            `• Token API sudah diisi\n` +
            `• Format input benar\n` +
            `• Koneksi internet stabil`
        );
    }
};

channelReactHandler.help = ["channelreact", "chreact"];
channelReactHandler.tags = ["tools"];
channelReactHandler.command = /^(channelreact|chreact|reactch)$/i;
channelReactHandler.limit = 2;
channelReactHandler.cooldown = 10000;
channelReactHandler.premium = false;

export default channelReactHandler;