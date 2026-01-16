import fs from "fs";

const aliceHandler = async (m, { sock, text }) => {
    try {
        const ownerNumber = Array.isArray(global.owner) ? global.owner[0] : global.owner;
        const ownerJid = ownerNumber.includes("@s.whatsapp.net") ? ownerNumber : ownerNumber + "@s.whatsapp.net";
        const ownerName = global.ownerName || "Owner Bot";

        const caption = text || `👋 *Info Owner Bot*\n\n📛 Nama: ${ownerName}\n📱 Nomor: +${ownerNumber}`;

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
                        id: `${global.prefix}owner`
                    })
                },
                {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: 'Menu Bot',
                        id: `${global.prefix}menu`
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

        await sock.sendMessage(m.key.remoteJid, productMessage, { quoted: m });

        return true;
    } catch (err) {
        console.error(err);
        await sock.sendMessage(m.key.remoteJid, { 
            text: "❌ Gagal mengirim info owner" 
        }, { quoted: m });
        return false;
    }
};

aliceHandler.help = ["owner", "creator"];
aliceHandler.tags = ["info"];
aliceHandler.command = /^(owner|creator|pemilik)$/i;
aliceHandler.limit = false;

export default aliceHandler;
