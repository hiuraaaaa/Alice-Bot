import https from "https";

function extractVideoId(url) {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^#\&\?]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function fetchTranscript(videoId) {
  const apiUrl = `https://youtubescribe.com/api/transcript?videoId=${videoId}`;

  return new Promise((resolve, reject) => {
    https
      .get(apiUrl, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject("Gagal parsing JSON");
          }
        });
      })
      .on("error", (err) => {
        reject(err.message);
      });
  });
}

const handler = async (m, { sock, text, reply }) => {
  if (!text)
    return reply(
      "❌ Kirim URL YouTube!\nContoh:\n.transcribe https://youtu.be/xxxx"
    );

  let videoId = extractVideoId(text);
  if (!videoId) return reply("❌ URL tidak valid!");

  await reply("⏳ Mengambil transcript…");

  try {
    const result = await fetchTranscript(videoId);

    if (!result || !result.transcript) {
      return reply("❌ Transcript tidak tersedia pada video ini.");
    }

    let transcript = result.transcript;

    // ✅ FIX: kalau array → gabungin text jadi satu string
    if (Array.isArray(transcript)) {
      transcript = transcript.map((x) => x.text).join(" ");
    }

    return sock.sendMessage(
      m.key.remoteJid,
      {
        text:
          `📑 *YouTube Transcript*\n\n` +
          transcript.substring(0, 4000),
      },
      { quoted: m }
    );
  } catch (err) {
    return reply("❌ Error mengambil transcript:\n" + err);
  }
};

handler.command = /^transcribe$/i;
handler.tags = ["tools"];
handler.help = ["transcribe <url_youtube>"];

export default handler;