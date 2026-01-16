import fetch from 'node-fetch';

const ttsHandler = async (m, { sock, reply, text }) => {
  try {
    if (!text) return reply(`_📢 Kirim teks!_\nContoh: ${global.prefix}tts Goku Halo Ganteng!`);

    // Format: <voice> <text>
    const splitText = text.split(' ');
    const voiceName = splitText.shift().toLowerCase(); // ambil kata pertama sebagai suara
    const ttsText = splitText.join(' ');
    if (!ttsText) return reply('_📢 Masukkan teks setelah nama suara!_');

    await reply(`_🔊 Membuat TTS dengan suara ${voiceName}..._`);

    // 1. Request API Heroikzre
    const url = `https://heroikzre-api.vercel.app/tools/text-to-speech?text=${encodeURIComponent(ttsText)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.result || !Array.isArray(data.result)) {
      return reply('_❌ Gagal memproses TTS_');
    }

    // 2. Cari voice yang cocok
    const voiceItem = data.result.find(v => v.voice_name?.toLowerCase() === voiceName);
    if (!voiceItem) return reply('_❌ Nama suara tidak ditemukan_');

    // Ambil URL audio
    const audioKey = Object.keys(voiceItem).find(k => !['voice_name','channel_id','voice_id','modelName','error'].includes(k));
    const audioUrl = voiceItem[audioKey];
    if (!audioUrl) return reply('_❌ URL audio tidak tersedia_');

    // 3. Download audio ke buffer langsung
    const audioRes = await fetch(audioUrl);
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    // 4. Kirim audio langsung tanpa simpan file
    await sock.sendMessage(
      m.key.remoteJid,
      {
        audio: audioBuffer,
        mimetype: 'audio/wav',
        ptt: false, // bisa diubah true kalau mau voice note
        caption: `_🔊 TTS by ${voiceName}_`
      },
      { quoted: m }
    );

  } catch (err) {
    console.error(err);
    await reply('_❌ Terjadi kesalahan saat membuat TTS_');
  }
};

ttsHandler.help = ['tts'];
ttsHandler.tags = ['tools'];
ttsHandler.command = /^(tts)$/i;

export default ttsHandler;