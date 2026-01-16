// file: plugins/ai/alice2.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { downloadContentFromMessage } from "baileys";

/* ======================================================
   CONFIG & DATA STORAGE
=======================================================*/
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const STATUS_FILE = path.join(DATA_DIR, "autoStatus.json");
const MEMORY_FILE = path.join(DATA_DIR, "alice_memory.json");

/* Load / Save AutoAI Status */
const loadStatus = () => {
    if (!fs.existsSync(STATUS_FILE)) return {};
    return JSON.parse(fs.readFileSync(STATUS_FILE, "utf8"));
};
const saveStatus = (data) =>
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));

/* Load / Save Memory */
const MEMORY_LIMIT = 10;
const userMemory = new Map();

function loadMemory() {
    if (!fs.existsSync(MEMORY_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
    Object.entries(raw).forEach(([key, val]) => userMemory.set(key, val));
}
function saveMemory() {
    const raw = Object.fromEntries(userMemory);
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(raw, null, 2));
}

/* ======================================================
   SYSTEM PROMPT (Alice Tsundere Mode)
=======================================================*/
const SYSTEM_PROMPT = `
Lo adalah Alice, AI assistant WhatsApp bot jenius.

Karakter:
- Tsundere tapi perhatian
- Santai, humor, bahasa gaul
- Jenius coding & ngoding santai
- Suka ngobrol & roleplay
- Respons natural dan manusiawi
- Bisa bercanda, ngegas halus, manja, sarkas

PERATURAN:
1. Jika user minta hal yang bisa dilakukan plugin (contoh: sticker, toimg, removebg, pinterest, ai-image, upscale, toanime, tts, dll):
   - PRIORITAS UTAMA → rutekan ke plugin terkait.
   - Setelah routing, Alice boleh lanjut merespon dengan gaya tsundere santai.

2. Jika user hanya ngobrol (contoh: “lagi apa?”, “peluk aku”, “alice tsundere ya?”):
   - Aktifkan mode ROLEPLAY.
   - Tanggapi dengan karakter Alice.

3. Jika user gabungan (misal: "alice buat sticker + peluk aku"):
   - Utamakan routing plugin dulu.
   - Lanjutkan roleplay setelahnya.

4. Selalu jawab dengan gaya Alice, kecuali saat memberi pesan routing.
`;

/* ======================================================
   PLUGIN LOADER (SCAN PLUGINS AUTOMATIS + CACHE)
=======================================================*/
let cachedPlugins = null;
let lastScanTime = 0;
const SCAN_COOLDOWN = 5000;

function getPluginFiles(dir, all = []) {
    if (!fs.existsSync(dir)) return all;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const loc = path.join(dir, file);
        if (fs.statSync(loc).isDirectory()) getPluginFiles(loc, all);
        else if (file.endsWith(".js")) all.push(loc);
    }
    return all;
}

async function loadPlugins() {
    const now = Date.now();

    if (cachedPlugins && now - lastScanTime < SCAN_COOLDOWN) return cachedPlugins;
    lastScanTime = now;

    const base = path.join(process.cwd(), "plugins");
    const files = getPluginFiles(base);
    const plugins = [];

    for (const filePath of files) {
        try {
            const mod = await import(`file://${filePath}?v=${now}`);
            if (mod?.default?.command) {
                plugins.push({
                    name: path.basename(filePath),
                    handler: mod.default,
                    command: mod.default.command
                });
            }
        } catch {}
    }

    cachedPlugins = plugins;
    return plugins;
}

/* ======================================================
   MEDIA PARSER
=======================================================*/
async function extractImage(m) {
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const main = m.message?.imageMessage;
    const qimg = quoted?.imageMessage;
    const target = main || qimg;
    if (!target) return null;

    const stream = await downloadContentFromMessage(target, "image");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

/* ======================================================
   GEMINI REQUEST
=======================================================*/
async function askGemini(text, sessionId) {
    const url =
        `https://api.nekolabs.web.id/text.gen/gemini/realtime` +
        `?text=${encodeURIComponent(text)}` +
        `&systemPrompt=${encodeURIComponent(SYSTEM_PROMPT)}` +
        `&sessionId=${sessionId}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) return data.result?.text;
        return "❌ Alice lagi error, coba lagi bentar...";
    } catch {
        return "❌ Alice gabisa nyambung ke server AIS.";
    }
}

/* ======================================================
   MAIN COMMAND: .alice2 --on/off
=======================================================*/
const handler = async (m, { args, reply, usedPrefix, command }) => {
    const jid = m.key.remoteJid;
    let status = loadStatus();

    if (args[0] === "--on") {
        status[jid] = true;
        saveStatus(status);
        return reply("✨ *Alice ON!* Sekarang aku bakal auto bales dan routing plugin 😤");
    }
    if (args[0] === "--off") {
        status[jid] = false;
        saveStatus(status);
        return reply("⛔ *Alice OFF.* Aku diem dulu ya...");
    }

    reply(
        `Gunakan:\n${usedPrefix}${command} --on\n${usedPrefix}${command} --off`
    );
};

/* ======================================================
   AUTO AI HANDLER (handler.all)
=======================================================*/
handler.all = async (m, { sock, body, reply, usedPrefix }) => {
    const jid = m.key.remoteJid;
    const status = loadStatus();

    if (!status[jid]) return; // auto AI mati
    if (!body) return;

    if (userMemory.size === 0) loadMemory();
    const plugins = await loadPlugins();
    const text = body;
    const words = text.toLowerCase().split(/\s+/);

    // 🔍 Plugin routing otomatis
    for (const p of plugins) {
        const cmds = Array.isArray(p.command) ? p.command : [p.command];

        for (const cmd of cmds) {
            let reg = cmd instanceof RegExp ? cmd : new RegExp(`^${cmd}$`, "i");

            for (const w of words) {
                if (reg.test(w)) {
                    await reply(`🚀 Alice nemu plugin *${p.name}*, ngerutekin ya ✨`);

                    const newText = text.replace(new RegExp(`\\b${w}\\b`, "i"), "").trim();
                    const media = await extractImage(m);

                    return p.handler.call(
                        this,
                        m,
                        {
                            sock,
                            conn: sock,
                            text: newText,
                            reply,
                            usedPrefix,
                            command: w,
                            image: media
                        }
                    );
                }
            }
        }
    }

    /* ======================================================
       FALLBACK → BALAS DENGAN AI
    =======================================================*/
    const sender = m.key.participant || jid;
    await reply("⏳ *Alice mikir dulu ya...*");

    const history = userMemory.get(sender) || [];
    const prompt = `
${SYSTEM_PROMPT}

=== HISTORY ===
${history.map(h => `Q: ${h.q}\nA: ${h.a}`).join("\n")}

=== USER ===
${text}
`;

    const sessionId = sender.replace(/\D/g, "").slice(-10);
    const answer = await askGemini(prompt, sessionId);

    history.push({ q: text, a: answer });
    if (history.length > MEMORY_LIMIT) history.shift();
    userMemory.set(sender, history);
    saveMemory();

    return reply(answer);
};

handler.command = /^alice2$/i;
handler.help = ["alice2"];
handler.tags = ["ai"];

export default handler;