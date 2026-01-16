import fetch from "node-fetch"
import ytdlp from "yt-dlp-exec"
import ffmpeg from "fluent-ffmpeg"
import fs from "fs"

let handler = async (m, { sock, text }) => {

    const chat = m.key.remoteJid

    const send = (txt) => sock.sendMessage(chat, { text: txt }, { quoted: m })

    if (!text) 
        return send("Masukkan URL video!\n\nContoh:\n*.clipper https://youtube.com/watch?v=xxxxx*")

    const VIDEO_URL = text.trim()

    try {
        await send("⏳ Mengambil summary video...")

        // ======== SUMMARY ========
        let sRes = await fetch(
            "https://api.nekolabs.web.id/tools/yt-summarizer/v2?url=" + 
            encodeURIComponent(VIDEO_URL)
        )

        let sJson = await sRes.json()

        if (!sJson.success)
            return send("❌ Gagal mengambil summary:\n" + (sJson.message || "-"))

        const SUMMARY = sJson.result.content

        await send("⏳ Meminta AI memilih momen terbaik...")

        // ======== PROMPT ========
        const PROMPT = `
Analisis ringkasan video sebagai Senior Viral Editor.

Format JSON array:
[
 {
   "title": "",
   "about": "",
   "summary": "",
   "start": 0,
   "end": 0,
   "confidence": 0.0
 }
]

Minimal confidence 0.75
Durasi 20–50 detik
Ringkasan video:
${SUMMARY}
`

        // ======== REQUEST AI ========
        let aiRes = await fetch(
            "https://api.nekolabs.web.id/text.gen/gpt/4.1-nano?text=" +
            encodeURIComponent(PROMPT) +
            "&systemPrompt=Senior Viral Editor&sessionId=clipperAI"
        )

        let aiJson = await aiRes.json()

        let raw = (aiJson.result || "").replace(/```json|```/gi, "").trim()
        let match = raw.match(/\[[\s\S]*?\]/)

        if (!match) 
            return send("❌ AI mengirim format tidak valid:\n" + raw)

        let clips = []

        try { clips = JSON.parse(match[0]) }
        catch (e) { return send("❌ Error parsing JSON:\n" + e) }

        clips = clips.filter(c => Number(c.confidence) >= 0.75)

        if (!clips.length)
            return send("❌ Tidak ada clip dengan confidence ≥ 0.75")

        await send(`📌 *${clips.length} Clip lolos kurasi.*\n⏳ Download video...`)

        // ======== DOWNLOAD VIDEO ========
        const VIDEO_FILE = "clipper_main_video.mp4"

        await ytdlp(VIDEO_URL, {
            output: VIDEO_FILE,
            noCheckCertificates: true,
            forceOverwrites: true
        })

        if (!fs.existsSync(VIDEO_FILE))
            return send("❌ Gagal download video!")

        // Folder clips
        fs.mkdirSync("clips", { recursive: true })

        const toTime = sec => new Date(sec * 1000).toISOString().substring(11, 19)

        for (let i in clips) {
            const c = clips[i]

            const start = toTime(c.start)
            const end = toTime(c.end)

            const safe = c.title.replace(/[^a-zA-Z0-9]/g, "")
            const OUT = `clips/clip_${parseInt(i) + 1}_${safe}.mp4`

            await send(`✂️ Memotong clip *${c.title}*...`)

            await new Promise((resolve, reject) => {
                ffmpeg(VIDEO_FILE)
                    .setStartTime(start)
                    .setDuration(c.end - c.start)
                    .output(OUT)
                    .on("end", resolve)
                    .on("error", reject)
                    .run()
            })

            const CAPTION = `
🎬 *${c.title}*
${c.summary}

⏱ ${start} → ${end}
Confidence: ${c.confidence}
`.trim()

            await sock.sendMessage(
                chat,
                { video: fs.readFileSync(OUT), caption: CAPTION },
                { quoted: m }
            )
        }

        await send("✔️ *SELESAI!* Semua clips dikirim.")

    } catch (e) {
        console.error(e)
        send("❌ Error:\n" + e)
    }
}

handler.help = ["clipper <url>"]
handler.tags = ["tools"]
handler.command = /^clipper$/i

export default handler