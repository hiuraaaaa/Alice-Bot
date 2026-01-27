import * as baileys from 'baileys';
import crypto from "node:crypto";

async function sendGroupStatus(sock, jid, content) {
    const { backgroundColor } = content;
    const cleanContent = { ...content };
    delete cleanContent.backgroundColor;

    const inside = await baileys.generateWAMessageContent(cleanContent, {
        upload: sock.waUploadToServer,
        backgroundColor: backgroundColor || "#1c1c1c" 
    });

    const messageSecret = crypto.randomBytes(32);

    const m = baileys.generateWAMessageFromContent(
        jid, 
        {
            messageContextInfo: { messageSecret },
            groupStatusMessageV2: {
                message: {
                    ...inside,
                    messageContextInfo: { messageSecret }
                }
            }
        }, 
        {}
    );

    await sock.relayMessage(jid, m.message, {
        messageId: m.key.id
    });
    return m;
}

const handler = async (m, { sock, text, command }) => {
    const chatJid = m.key.remoteJid;
    const prefix = global.prefix; 

    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const msg = m.message?.imageMessage || m.message?.videoMessage || m.message?.audioMessage 
                ? m.message 
                : (quoted?.imageMessage || quoted?.videoMessage || quoted?.audioMessage ? quoted : null);

    const mime = (msg?.imageMessage || msg?.videoMessage || msg?.audioMessage)?.mimetype || "";
    const caption = text || "";

    try {
        let payload = {};

        if (/image/.test(mime)) {
            const target = msg.imageMessage || quoted.imageMessage;
            const stream = await baileys.downloadContentFromMessage(target, "image");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            payload = { image: buffer, caption };
        } 
        else if (/video/.test(mime)) {
            const target = msg.videoMessage || quoted.videoMessage;
            const stream = await baileys.downloadContentFromMessage(target, "video");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            payload = { video: buffer, caption };
        } 
        else if (/audio/.test(mime)) {
            const target = msg.audioMessage || quoted.audioMessage;
            const stream = await baileys.downloadContentFromMessage(target, "audio");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            payload = { audio: buffer, mimetype: "audio/mp4" };
        } 
        else if (caption) {
            payload = { text: caption, backgroundColor: "#075e54" };
        } 
        else {
            return await sock.sendMessage(chatJid, { 
                text: `Kirim atau reply media dengan caption, lalu ketik:\n*${prefix + command}*` 
            }, { quoted: m });
        }

        await sendGroupStatus(sock, chatJid, payload);
        await sock.sendMessage(chatJid, { react: { text: "✅", key: m.key } });

    } catch (err) {
        console.error("[SWGC ERROR]", err);
        await sock.sendMessage(chatJid, { text: "❌ Gagal mengirim status grup." }, { quoted: m });
    }
};

handler.help = ["swgc"];
handler.tags = ["group"];
handler.command = /^(upswgc|swgc|swgrup)$/i;

// --- FLAGS ---
handler.group = true;  // Hanya bisa di grup
handler.admin = true;  // Hanya admin yang bisa pakai
export default handler;