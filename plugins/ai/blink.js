import fetch from 'node-fetch';
import { Buffer } from 'buffer';

const handler = async (m, { sock, reply, text, sender, consumeLimit }) => {
  try {
    if (!text) return reply(`❗ Please provide a prompt.\nExample: *${global.prefix}blink Cute cat*`);

    await reply("```\nGenerating image...\n```");

    const payload = {
      prompt: text,
      userAPIKey: "",
      iterativeMode: false
    };

    const response = await fetch('https://www.blinkshot.io/api/generateImages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data || !data.b64_json) return reply('❌ Failed to generate image.');

    const imageBuffer = Buffer.from(data.b64_json, 'base64');

    await sock.sendMessage(m.key.remoteJid, {
      image: imageBuffer,
      caption: `✅ Image generated successfully!\n⏱️ Inference: ${data.timings?.inference || 'N/A'}ms`
    }, { quoted: m });

    if (consumeLimit) consumeLimit(sender, 1);

  } catch (err) {
    console.error("[BLINKSHOT ERROR]", err);
    reply('❌ An error occurred while generating the image.');
  }
};

handler.help = ['blink'];
handler.tags = ['ai', 'image'];
handler.command = /^(blink)$/i;
handler.limit = true;
handler.cooldown = 30000;

export default handler;