import { OpenAI } from 'openai';

const client = new OpenAI();

let handler = async (m, { text }) => {
  if (!text) return m.reply('Masukkan pertanyaan Anda!\nContoh: .ai apa itu RPG?');
  
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: text }],
    });

    m.reply(response.choices[0].message.content);
  } catch (e) {
    m.reply('Terjadi kesalahan saat menghubungi AI.');
  }
};

handler.command = /^(ai|chatgpt)$/i;

export default handler;
