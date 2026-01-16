import fetch from "node-fetch";

const aliceHandler = async (m, { sock, sender }) => {
    try {
        await sock.sendMessage(m.key.remoteJid, { 
            text: global.mess.wait 
        }, { quoted: m });

        const api = "https://kuronekoapies.movanest.xyz/api/random/waifu";
        const res = await fetch(api);
        
        if (!res.ok) {
            await sock.sendMessage(m.key.remoteJid, {
                text: "❌ Gagal mengambil gambar waifu."
            }, { quoted: m });
            return false;
        }

        const buffer = Buffer.from(await res.arrayBuffer());

        await sock.sendMessage(m.key.remoteJid, {
            image: buffer,
            caption: `✨ *Random Waifu*\n\nUntuk: @${sender.split("@")[0]}`
        }, {
            quoted: m,
            mentions: [sender]
        });

        return true;
    } catch (err) {
        console.error(err);
        await sock.sendMessage(m.key.remoteJid, {
            text: "❌ Terjadi kesalahan saat mengambil gambar."
        }, { quoted: m });
        return false;
    }
};

aliceHandler.help = ["waifu"];
aliceHandler.tags = ["random"];
aliceHandler.command = /^(waifu)$/i;
aliceHandler.limit = false;
aliceHandler.cooldown = 5000;

export default aliceHandler;
