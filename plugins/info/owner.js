// plugins/owner/ownerinfo.js
import fs from "fs";

const ownerInfoHandler = async (m, { sock, text }) => {
    try {
        const ownerNumber = Array.isArray(global.owner) ? global.owner[0] : global.owner;
        const ownerJid = ownerNumber.includes("@s.whatsapp.net") ? ownerNumber : ownerNumber + "@s.whatsapp.net";
        const ownerName = global.ownerName || "Owner Bot";

        // Caption default
        const caption = text || `👋 Halo! Ini info owner bot:\n\nNama: ${ownerName}\nNomor: +${ownerNumber}`;

        // Product card sederhana untuk Owner
        const productMessage = {
            product: {
                productImage: { url: "https://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/1767887523286.jpg" },
                productId: '0',
                title: `Owner: ${ownerName}`,
                description: `Nomor WhatsApp: +${ownerNumber}`,
                currencyCode: '0',
                priceAmount1000: '0',
                retailerId: ownerName,
                url: `https://wa.me/${ownerNumber}`,
                productImageCount: 1
            },
            businessOwnerJid: ownerJid,
            caption: caption,
            footer: "Owner Info",
            buttons: [
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'Chat Owner',
                        id: ".owner"
                    })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'Menu Bot',
                        id: ".menu"
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'WhatsApp Owner',
                        url: `https://wa.me/${ownerNumber}`
                    })
                }
            ],
            hasMediaAttachment: false
        };

        // Kirim pesan
        await sock.sendMessage(m.key.remoteJid, productMessage, { quoted: m });

    } catch (err) {
        console.error("Owner info plugin error:", err);
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Gagal mengirim info owner" }, { quoted: m });
    }
};

// Plugin info
ownerInfoHandler.help = ["owner"];
ownerInfoHandler.tags = ["info"];
ownerInfoHandler.command = /^(owner|creator|pemilik)$/i;

export default ownerInfoHandler;