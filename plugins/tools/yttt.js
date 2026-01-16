import { transcribe } from "@nefu-team/core";

const handler = async (m, { sock, text, reply }) => {
  if (!text)
    return reply(
      "❌ Kirim URL YouTube!\nContoh:\n.transcribe https://youtu.be/xxxx"
    );

  await reply("⏳ Mengambil transcript…");

  try {
    // Gunakan npm package core kita
    const transcript = await transcribe(text);

    return sock.sendMessage(
      m.key.remoteJid,
      {
        text: `📑 *YouTube Transcript*\n\n${transcript.substring(0, 4000)}`,
      },
      { quoted: m }
    );
  } catch (err) {
    return reply("❌ Error mengambil transcript:\n" + err.message);
  }
};

handler.command = /^transcribe2$/i;
handler.tags = ["tools"];
handler.help = ["transcribe2 <url_youtube>"];

export default handler;