import { getPlayer, updatePlayer, getAllPlayers } from '../../../lib/rpg/database/playerDB.js';
import { DUNGEONS, enterDungeon } from '../../../lib/rpg/systems/dungeonSystem.js';
import { RECIPES, craftItem } from '../../../lib/rpg/systems/craftSystem.js';
import { ITEMS } from '../../../lib/rpg/data/items.js';

let handler = async (m, { conn, command, text, args }) => {
    let user = m.sender;
    let player = await getPlayer(user);
    if (!player) return m.reply('Daftar dulu ketik .register');

    if (command === 'dungeon') {
        if (!text) {
            let txt = `🏰 *AVAILABLE DUNGEONS*\n\n`;
            for (let d of DUNGEONS) {
                txt += `- *${d.name}* (${d.id})\n  Level: ${d.minLevel} | Energy: ${d.energy} | Stages: ${d.stages}\n`;
            }
            txt += `\nCara masuk: .dungeon <id>`;
            return m.reply(txt);
        }
        let res = await enterDungeon(player, text.trim());
        if (!res.success) return m.reply(res.message);
        
        if (res.cleared) {
            player.resources.gold += res.rewards.gold;
            player.exp += res.rewards.exp;
            for (let item of res.rewards.drops) {
                player.inventory.items[item] = (player.inventory.items[item] || 0) + 1;
            }
        }
        await updatePlayer(user, player);
        return m.reply(res.logs.join('\n') + `\n\n💰 Total Gold: ${res.rewards.gold}\n✨ Total EXP: ${res.rewards.exp}\n📦 Drops: ${res.rewards.drops.join(', ') || 'None'}`);
    }

    if (command === 'craft') {
        if (!text) {
            let txt = `🛠️ *CRAFTING RECIPES*\n\n`;
            for (let [id, r] of Object.entries(RECIPES)) {
                let mats = Object.entries(r.materials).map(([m, c]) => `${c} ${ITEMS[m].name}`).join(', ');
                txt += `- *${ITEMS[id].name}* (${id})\n  Mats: ${mats}\n  Cost: ${r.gold} Gold\n`;
            }
            txt += `\nCara craft: .craft <id>`;
            return m.reply(txt);
        }
        let res = craftItem(player, text.trim());
        if (res.success) await updatePlayer(user, player);
        return m.reply(res.message);
    }

    if (command === 'leaderboard' || command === 'lb') {
        let players = await getAllPlayers();
        let sorted = Object.values(players).sort((a, b) => b.level - a.level || b.exp - a.exp).slice(0, 10);
        let txt = `🏆 *TOP 10 PLAYERS*\n\n`;
        sorted.forEach((p, i) => {
            txt += `${i + 1}. ${p.name} - Level ${p.level} (${p.exp} EXP)\n`;
        });
        return m.reply(txt);
    }

    if (command === 'heal') {
        let cost = (player.stats.maxHp - player.stats.hp) * 2;
        if (cost <= 0) return m.reply('HP kamu sudah penuh!');
        if (player.resources.gold < cost) return m.reply(`Butuh ${cost} Gold untuk heal penuh!`);
        
        player.resources.gold -= cost;
        player.stats.hp = player.stats.maxHp;
        await updatePlayer(user, player);
        m.reply(`❤️ Berhasil heal penuh seharga ${cost} Gold.`);
    }
};

handler.command = /^(dungeon|craft|leaderboard|lb|heal)$/i;
export default handler;
