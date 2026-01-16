import fs from "fs";

const menuSimpleHandler = async (m, { sock }) => {
  try {
    const sender = m.sender || m.key?.participant || "user";

    const botName = "Robin Bot";
    const ucapan = "Halo! Selamat datang";
    const thumbnailUrl = "https://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/1767707103316.jpg";
    const waLink = "https://wa.me/62882006639544"; // ganti nomor owner

    const teks = `👋 Hai ${sender.split("@")[0]}!\n${ucapan}\n\n` +
                 `🤖 Bot: ${botName}`;

    await sock.sendMessage(m.key.remoteJid, {
      text: teks,
      footer: botName,
      interactiveButtons: [
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Hubungi Owner",
            url: waLink
          })
        }
      ],
      contextInfo: {
        isForwarded: true,
        mentionedJid: [sender],
        externalAdReply: {
          title: botName,
          body: ucapan,
          thumbnailUrl: thumbnailUrl,
          sourceUrl: waLink
        }
      }
    }, { quoted: m.key ? m : undefined });

  } catch (err) {
    console.error("Menu Simple Error:", err);
    await sock.sendMessage(m.key.remoteJid, { text: "❌ Gagal menampilkan menu" }, { quoted: m });
  }
};

menuSimpleHandler.help = ["menu2"];
menuSimpleHandler.tags = ["main"];
menuSimpleHandler.command = /^(menu2|start)$/i;

export default menuSimpleHandler;