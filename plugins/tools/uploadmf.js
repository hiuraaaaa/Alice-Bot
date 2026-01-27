import fetch from 'node-fetch';
import FormData from 'form-data';
import crypto from 'crypto';

let handler = async (m, { conn, args, usedPrefix, command }) => {

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    if (!mime) throw `Please reply to a file/media with ${usedPrefix + command}`;

    await m.reply('🚀 *Processing upload to MediaFire...*');

    try {
        let media = await q.download();
        let filename = q.msg?.fileName || `upload_${Date.now()}.${mime.split('/')[1] || 'bin'}`;

        const fileSize = media.length;
        const fileHash = crypto.createHash('sha256').update(media).digest('hex');

        const COOKIE_API_URL = 'https://cookies.ryzecodes.xyz/api/cookies';
        const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';

        // 1. GET Cookies
        const cookieReq = await fetch(COOKIE_API_URL);
        const cookieJson = await cookieReq.json();

        if (!cookieJson.cookies) throw new Error("Invalid Cookie API");

        const cookieHeader = cookieJson.cookies.map(c => `${c.name}=${c.value}`).join('; ');

        const baseHeaders = {
            'User-Agent': USER_AGENT,
            'Cookie': cookieHeader,
            'Origin': 'https://app.mediafire.com',
            'Referer': 'https://app.mediafire.com/'
        };

        // 2. GET Session Token
        const tokenReq = await fetch(
            'https://www.mediafire.com/application/get_session_token.php',
            {
                method: 'POST',
                headers: { ...baseHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'response_format=json'
            }
        );

        const sessionData = await tokenReq.json();
        const sessionToken = sessionData?.response?.session_token;
        if (!sessionToken) throw new Error("Failed to get session token");

        // 3. GET Action Token
        const actionReq = await fetch(
            'https://www.mediafire.com/api/1.5/user/get_action_token.php',
            {
                method: 'POST',
                headers: { ...baseHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `session_token=${sessionToken}&response_format=json&type=upload&lifespan=1440`
            }
        );

        const actionJson = await actionReq.json();
        if (actionJson.response.result !== 'Success')
            throw new Error("Failed to get action token");

        const actionToken = actionJson.response.action_token;

        // 4. Upload Check
        const checkForm = new FormData();
        checkForm.append('uploads', JSON.stringify([{
            filename: filename,
            folder_key: 'myfiles',
            size: fileSize,
            hash: fileHash,
            resumable: 'yes',
            preemptive: 'yes'
        }]));
        checkForm.append('session_token', sessionToken);
        checkForm.append('response_format', 'json');

        const checkReq = await fetch(
            'https://www.mediafire.com/api/1.5/upload/check.php',
            {
                method: 'POST',
                headers: { ...baseHeaders, ...checkForm.getHeaders() },
                body: checkForm
            }
        );

        const checkData = await checkReq.json();
        if (checkData.response.result !== 'Success')
            throw new Error("Check failed");

        let uploadUrl = checkData.response?.upload_url?.resumable ||
            'https://www.mediafire.com/api/upload/resumable.php';

        if (checkData.response.hash_exists === 'yes') {
            return m.reply("⚠️ File already exists on MediaFire account.");
        }

        // 5. Upload File
        const finalUrl =
            `${uploadUrl}?session_token=${sessionToken}&action_token=${actionToken}&response_format=json`;

        const resumableHeaders = {
            'User-Agent': USER_AGENT,
            'x-file-hash': fileHash,
            'x-file-size': fileSize.toString(),
            'x-file-name': filename,
            'x-filename': filename,
            'x-filesize': fileSize.toString(),
            'x-unit-id': '0',
            'x-unit-size': fileSize.toString(),
            'x-unit-hash': fileHash,
            'Content-Type': 'application/octet-stream'
        };

        const uploadReq = await fetch(finalUrl, {
            method: 'POST',
            headers: resumableHeaders,
            body: media
        });

        const uploadJson = await uploadReq.json();
        if (uploadJson.response?.result !== 'Success')
            throw new Error("Upload failed");

        const uploadKey = uploadJson.response.doupload.key;

        // 6. Polling QuickKey
        const pollUrl = 'https://www.mediafire.com/api/1.5/upload/poll_upload.php';
        let quickKey = null;

        for (let i = 0; i < 20; i++) {
            const pollForm = new FormData();
            pollForm.append('key', uploadKey);
            pollForm.append('session_token', sessionToken);
            pollForm.append('response_format', 'json');

            const pollReq = await fetch(pollUrl, {
                method: 'POST',
                headers: { ...baseHeaders, ...pollForm.getHeaders() },
                body: pollForm
            });

            const pollJson = await pollReq.json();
            const r = pollJson.response.doupload;

            if (r.result === '0' && r.status === '99') {
                quickKey = r.quickkey;
                break;
            }

            await new Promise(res => setTimeout(res, 2000));
        }

        if (!quickKey) throw new Error("Timed out waiting QuickKey");

        const link = `https://www.mediafire.com/file/${quickKey}/`;

        await m.reply(
`✅ *UPLOAD SUCCESSFUL*
📄 *File:* ${filename}
📦 *Size:* ${fileSize} bytes
🔗 *Link:* ${link}`
        );

    } catch (e) {
        console.log(e);
        m.reply(`❌ *Upload Failed:* ${e.message}`);
    }
};

handler.help = ['mediafireupload'];
handler.tags = ['tools'];
handler.command = /^(uploadmf|mfupload|mediafireupload)$/i;

export default handler;