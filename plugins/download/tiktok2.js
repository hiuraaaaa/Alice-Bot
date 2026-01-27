import fetch from 'node-fetch';

const handler = async (m, { sock, reply, text }) => {
    try {
        if (!text) {
            await reply(`❗ Masukkan URL TikTok\nContoh: *${global.prefix}tiktok https://vt.tiktok.com/ZSaan6TSe/*`);
            return false;
        }

        const urlMatch = text.match(/https?:\/\/(vt\.tiktok\.com|vm\.tiktok\.com|www\.tiktok\.com|tiktok\.com)\/\S+/);
        if (!urlMatch) {
            await reply('❌ URL TikTok tidak valid!');
            return false;
        }

        const url = urlMatch[0];
        const loadingMsg = await sock.sendMessage(m.key.remoteJid, {
            text: "```\n⏳ Downloading TikTok content...\n```"
        }, { quoted: m });

        const apiUrl = `https://labs.shannzx.xyz/api/v1/tiktok?url=${encodeURIComponent(url)}`;
        const response = await fetch(apiUrl, { timeout: 30000 });
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.status || !data.result) {
            await reply('❌ Gagal mengambil data TikTok. URL mungkin tidak valid atau video sudah dihapus.');
            return false;
        }

        const { type, result } = data;

        if (type === 'slide') {
            const { title, slides, music, total_slides } = result;
            
            if (!slides || !Array.isArray(slides) || slides.length === 0) {
                await reply('❌ Tidak ada slide yang ditemukan.');
                return false;
            }

            let caption = `✅ *TikTok Slides Download*\n\n`;
            caption += `📝 *Title:* ${title || 'No title'}\n`;
            caption += `🖼️ *Total Slides:* ${total_slides || slides.length}\n`;
            if (music && music.title && music.author) {
                caption += `🎵 *Music:* ${music.title} - ${music.author}\n`;
            }

            // Kirim semua slide
            for (let i = 0; i < slides.length; i++) {
                try {
                    await sock.sendMessage(m.key.remoteJid, {
                        image: { url: slides[i] },
                        caption: i === 0 ? caption : `Slide ${i + 1}/${slides.length}`
                    }, { quoted: m });
                } catch (imgErr) {
                    console.error(`Error sending slide ${i + 1}:`, imgErr);
                }
            }

            // Kirim audio jika ada
            if (music && music.url) {
                try {
                    await sock.sendMessage(m.key.remoteJid, {
                        audio: { url: music.url },
                        mimetype: 'audio/mpeg',
                        fileName: `${music.title || 'audio'}.mp3`
                    }, { quoted: m });
                } catch (audioErr) {
                    console.error('Error sending audio:', audioErr);
                }
            }

        } else if (type === 'video') {
            const { title, video_hd, video_sd, music, stats, duration } = result;
            
            // Prioritas: video_hd > video_sd
            const videoUrl = video_hd || video_sd;
            
            if (!videoUrl) {
                await reply('❌ Video URL tidak ditemukan.');
                return false;
            }

            let caption = `✅ *TikTok Video Download*\n\n`;
            caption += `📝 *Title:* ${title || 'No title'}\n`;
            caption += `⏱️ *Duration:* ${duration}s\n`;
            
            if (stats) {
                caption += `\n📊 *Stats:*\n`;
                caption += `👀 Views: ${stats.views?.toLocaleString() || 0}\n`;
                caption += `❤️ Likes: ${stats.likes?.toLocaleString() || 0}\n`;
                caption += `💬 Comments: ${stats.comments?.toLocaleString() || 0}\n`;
                caption += `🔄 Shares: ${stats.shares?.toLocaleString() || 0}\n`;
            }
            
            if (music && music.title && music.author) {
                caption += `\n🎵 *Music:* ${music.title} - ${music.author}`;
            }

            // Kirim video
            await sock.sendMessage(m.key.remoteJid, {
                video: { url: videoUrl },
                caption: caption,
                mimetype: 'video/mp4'
            }, { quoted: m });

        } else {
            await reply(`❌ Tipe konten tidak dikenali: ${type || 'unknown'}`);
            return false;
        }

        await sock.sendMessage(m.key.remoteJid, { delete: loadingMsg.key });
        return true;

    } catch (err) {
        console.error('TikTok Error:', err);
        await reply(`❌ Terjadi kesalahan: ${err.message || 'Unknown error'}`);
        return false;
    }
};

handler.help = ["tiktok", "tt2"];
handler.tags = ["downloader"];
handler.command = /^(tiktok|tt2|tiktokdl|ttdl)$/i;
handler.limit = false;
handler.cooldown = 5000;

export default handler;