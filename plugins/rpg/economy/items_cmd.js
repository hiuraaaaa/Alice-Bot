import { getPlayer, updatePlayer } from '../../../lib/rpg/database/playerDB.js';
import { ITEMS } from '../../../lib/rpg/data/items.js';
import { EMOJI } from '../../../config/rpg.config.js';

let handler = async (m, { conn, command, text, args }) => {
    let user = m.sender;
    let player = await getPlayer(user);
    if (!player) return m.reply('Daftar dulu ketik .register');

    if (command === 'inventory' || command === 'inv') {
        let txt = `🎒 *INVENTORY - ${player.name}*\n\n`;
        txt += `⚔️ *Weapon:* ${player.inventory.weapon ? ITEMS[player.inventory.weapon].name : 'None'}\n`;
        txt += `🛡️ *Armor:* ${player.inventory.armor ? ITEMS[player.inventory.armor].name : 'None'}\n\n`;
        txt += `📦 *Items:*\n`;
        
        let items = Object.entries(player.inventory.items);
        if (items.length === 0) txt += `- Kosong -\n`;
        for (let [id, count] of items) {
            txt += `- ${ITEMS[id]?.name || id}: ${count}\n`;
        }
        return m.reply(txt);
    }

    if (command === 'shop') {
        let txt = `🏪 *RPG SHOP*\n\n`;
        for (let [id, item] of Object.entries(ITEMS)) {
            if (item.price) txt += `- ${item.name} (${id}): ${item.price} Gold\n`;
        }
        txt += `\nCara beli: .buy <id> <jumlah>`;
        return m.reply(txt);
    }

    if (command === 'buy') {
        let id = args[0];
        let count = parseInt(args[1]) || 1;
        if (!ITEMS[id]) return m.reply('Item tidak ditemukan!');
        let total = ITEMS[id].price * count;
        if (player.resources.gold < total) return m.reply('Gold tidak cukup!');
        
        player.resources.gold -= total;
        player.inventory.items[id] = (player.inventory.items[id] || 0) + count;
        await updatePlayer(user, player);
        return m.reply(`Berhasil membeli ${count} ${ITEMS[id].name} seharga ${total} Gold.`);
    }

    if (command === 'use') {
        let id = args[0];
        if (!player.inventory.items[id]) return m.reply('Kamu tidak punya item ini!');
        let item = ITEMS[id];
        if (item.type !== 'potion') return m.reply('Item ini tidak bisa digunakan!');

        if (item.heal) {
            player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + item.heal);
            m.reply(`Menggunakan ${item.name}. HP +${item.heal}`);
        }
        if (item.heal_mp) {
            player.stats.mp = Math.min(player.stats.maxMp, player.stats.mp + item.heal_mp);
            m.reply(`Menggunakan ${item.name}. MP +${item.heal_mp}`);
        }

        player.inventory.items[id]--;
        if (player.inventory.items[id] === 0) delete player.inventory.items[id];
        await updatePlayer(user, player);
    }

    if (command === 'equip') {
        let id = args[0];
        if (!player.inventory.items[id]) return m.reply('Kamu tidak punya item ini!');
        let item = ITEMS[id];
        
        if (item.type === 'weapon') {
            if (player.inventory.weapon) {
                let old = player.inventory.weapon;
                player.inventory.items[old] = (player.inventory.items[old] || 0) + 1;
                player.stats.atk -= ITEMS[old].atk;
            }
            player.inventory.weapon = id;
            player.stats.atk += item.atk;
            player.inventory.items[id]--;
        } else if (item.type === 'armor') {
            if (player.inventory.armor) {
                let old = player.inventory.armor;
                player.inventory.items[old] = (player.inventory.items[old] || 0) + 1;
                player.stats.def -= ITEMS[old].def;
            }
            player.inventory.armor = id;
            player.stats.def += item.def;
            player.inventory.items[id]--;
        } else {
            return m.reply('Item ini bukan equipment!');
        }

        if (player.inventory.items[id] === 0) delete player.inventory.items[id];
        await updatePlayer(user, player);
        m.reply(`Berhasil menggunakan *${item.name}*!`);
    }
};

handler.command = /^(inventory|inv|shop|buy|use|equip)$/i;
export default handler;
