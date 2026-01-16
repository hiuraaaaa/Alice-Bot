import fetch from "node-fetch";

const waifuHandler = async (m, { sock, sender }) => {
    try {
        const api = "https://kuronekoapies.movanest.xyz/api/random/waifu";

        // Fetch gambar dari API (langsung buffer)
        const res = await fetch(api);
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const buffer = Buffer.from(await res.arrayBuffer());

        // Kirim gambar ke WhatsApp
        await sock.sendMessage(m.key.remoteJid, {
            image: buffer,
            caption: `✨ Random Waifu\nUntuk: @${sender.split("@")[0]}`
        }, {
            quoted: m,
            mentions: [sender]
        });

    } catch (e) {
        console.error("WAIFU ERROR:", e);
        await sock.sendMessage(m.key.remoteJid, {
            text: "❌ Gagal mengambil gambar waifu."
        }, { quoted: m });
    }
};

waifuHandler.help = ["waifu"];
waifuHandler.tags = ["fun", "random"];
waifuHandler.command = /^waifu$/i;

export default waifuHandler;