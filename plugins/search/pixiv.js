// file: plugins/search/pixiv.js
import fetch from "node-fetch";

const pixivHandler = async (m, { sock, text, args }) => {
    const jid = m.key.remoteJid;

    if (!text) {
        return await sock.sendMessage(jid, { 
            text: `❗ 検索キーワードと枚数（任意）を入力してください。\n例:\n.pixiv furina (ランダムで1枚)\n.pixiv furina 5 (5枚送信)` 
        }, { quoted: m });
    }

    // 引数から枚数を取得 (例: .pixiv furina 5)
    let count = 1;
    let query = text;
    
    if (args.length > 1 && !isNaN(args[args.length - 1])) {
        count = parseInt(args.pop());
        query = args.join(" ");
    }

    // スパム防止のため最大10枚に制限
    if (count > 10) count = 10;

    try {
        const apiUrl = `https://api.nekolabs.web.id/discovery/pixiv/safe?q=${encodeURIComponent(query)}`;
        const res = await fetch(apiUrl);
        const data = await res.json();

        if (!data.success || !data.result || data.result.length === 0) {
            return await sock.sendMessage(jid, { text: "❌ イラストが見つかりませんでした。" }, { quoted: m });
        }

        // 1枚の場合はランダム、複数の場合は順番に取得
        let results = [];
        if (count === 1) {
            results = [data.result[Math.floor(Math.random() * data.result.length)]];
        } else {
            results = data.result.slice(0, count);
        }

        for (let pix of results) {
            // タグを文字列に変換（最初の3つだけ表示してスッキリさせる）
            const tags = pix.tags.slice(0, 5).join(", ");
            
            const caption = `🎨 *PIXIV SEARCH*\n` +
                            `📝 *Title:* ${pix.caption || '無題'}\n` +
                            `👤 *Author:* ${pix.author}\n` +
                            `🏷️ *Tags:* ${tags}...\n` +
                            `🖼️ *Type:* ${pix.type}`;

            await sock.sendMessage(jid, { 
                image: { url: pix.imageUrl },
                caption: caption
            }, { quoted: count === 1 ? m : null });

            // 複数枚送信時の連続送信防止ディレイ
            if (results.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

    } catch (e) {
        console.error("[PIXIV ERROR]", e);
        await sock.sendMessage(jid, { text: "❌ 検索中にエラーが発生しました。" }, { quoted: m });
    }
};

pixivHandler.help = ['pixiv <query> <count>'];
pixivHandler.tags = ['search'];
pixivHandler.command = /^(pixiv)$/i;

export default pixivHandler;