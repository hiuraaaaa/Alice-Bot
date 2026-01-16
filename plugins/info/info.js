const pluginInfoHandler = async (m, { sock, text }) => {
    try {
        if (!text) return await sock.sendMessage(m.key.remoteJid, { text: "❌ Gunakan: .plugininfo <nama_plugin>" }, { quoted: m });

        const found = {
            name: text,
            description: "Deskripsi singkat fitur/plugin ini, manual dimasukkan.",
        };

        // URL thumbnail
        const thumbnail = "https://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/1767888632835.jpg";

        await sock.sendMessage(m.key.remoteJid, {
            text: `ℹ️ Informasi fitur: ${found.name}\n\n${found.description}`,
            contextInfo: {
                externalAdReply: {
                    body: `Informasi fitur ${found.name}`, // teks kecil di bawah thumbnail
                    thumbnailUrl: thumbnail,              // thumbnail dari URL
                    mediaType: 1,                         // 1 = link/media
                    renderLargerThumbnail: true           // thumbnail lebih besar
                },
                forwardingScore: 1,                      // tandai bisa forward
                isForwarded: true                        // tanda “forwarded”
            }
        }, { quoted: m });

    } catch (err) {
        console.error("Plugin info manual error:", err);
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Terjadi kesalahan saat menampilkan info plugin." }, { quoted: m });
    }
};

pluginInfoHandler.help = ["plugininfo"];
pluginInfoHandler.tags = ["tools"];
pluginInfoHandler.command = /^(plugininfo|pinfo)$/i;

export default pluginInfoHandler;