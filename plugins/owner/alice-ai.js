import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const SYSTEM_PROMPT = `
Lo adalah Alice, AI assistant WhatsApp bot jenius.
Role-play: tsundere, santai, jenius coding, pakai bahasa gaul.
Jawab dengan:
1. Analisis singkat
2. Solusi jelas
3. Sertakan kode final jika perlu (pakai block JS)
`;

const MEMORY_LIMIT = 10; 
const userMemory = new Map();
const userSessionConfig = new Map();

function scanProject(rootDir) {
    const files = [];
    function walk(dir) {
        const list = fs.readdirSync(dir);
        for (const f of list) {
            const full = path.join(dir, f);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                if (["node_modules", ".git", "auth_info", "data"].includes(f)) continue;
                walk(full);
            } else if (f.endsWith(".js") || f.endsWith(".json")) {
                files.push(full);
            }
        }
    }
    walk(rootDir);
    return files;
}

function loadFiles(files) {
    let text = "";
    let totalLength = 0;
    const MAX_LENGTH = 5000; // Batasi agar URL tidak terlalu panjang

    for (const file of files) {
        try {
            const content = fs.readFileSync(file, "utf8");
            const fileText = `\n\n===== FILE: ${path.basename(file)} =====\n${content}\n`;
            if (totalLength + fileText.length > MAX_LENGTH) break; // Berhenti jika sudah terlalu panjang
            text += fileText;
            totalLength += fileText.length;
        } catch {}
    }
    return text;
}

async function askGemini(question, sessionId, systemPrompt = SYSTEM_PROMPT) {
    const apiUrl = `https://api.nekolabs.web.id/text.gen/gemini/realtime?text=${encodeURIComponent(question)}&systemPrompt=${encodeURIComponent(systemPrompt)}&sessionId=${encodeURIComponent(sessionId)}`;
    
    const res = await fetch(apiUrl);
    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
        const errorText = await res.text();
        console.error("API Error Response:", errorText);
        throw new Error("API sedang sibuk atau limit (Server mengembalikan HTML). Coba lagi nanti.");
    }

    const data = await res.json();
    if (data.success && data.result && data.result.text) return data.result.text;
    throw new Error("Gagal mendapatkan jawaban dari Gemini API.");
}

const handler = async (m, { sock, text, reply }) => {
    const sender = m.key.participant || m.key.remoteJid;

    if (!text) return reply("❌ Mau tanya apa ke Alice?\nContoh: .alice cara kerja handler");

    if (text === "--clear") {
        userMemory.delete(sender);
        return reply("🗑️ Memory Alice sudah dibersihkan!");
    }

    const useSession = userSessionConfig.get(sender)?.enabled ?? true;
    await reply("⏳ Alice lagi baca project lo bentar...");

    try {
        const allFiles = scanProject(process.cwd());
        const projectText = loadFiles(allFiles);
        const history = useSession ? (userMemory.get(sender) || []) : [];

        const prompt = `
${SYSTEM_PROMPT}
=== PROJECT CONTEXT ===
${projectText}
=== HISTORY ===
${history.map(h => `Q: ${h.q}\nA: ${h.a}`).join("\n")}
=== QUESTION ===
${text}
`;

        const sessionId = sender.replace(/\D/g, '').slice(-10);
        let answer = await askGemini(prompt, sessionId, SYSTEM_PROMPT);

        if (useSession) {
            history.push({ q: text, a: answer });
            if (history.length > MEMORY_LIMIT) history.shift();
            userMemory.set(sender, history);
        }

        // Kirim jawaban (split jika terlalu panjang)
        if (answer.length > 4000) {
            for (let i = 0; i < answer.length; i += 4000) {
                await sock.sendMessage(m.key.remoteJid, { text: answer.slice(i, i + 4000) }, { quoted: m });
            }
        } else {
            await reply(answer);
        }

    } catch (err) {
        console.error(err);
        await reply(`❌ Alice error: ${err.message}`);
    }
};

handler.help = ["alice"];
handler.tags = ["ai"];
handler.command = /^alice$/i;

export default handler;