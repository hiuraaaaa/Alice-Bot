import { getPlayer, updatePlayer } from '../../../lib/rpg/database/playerDB.js';
import { MONSTERS } from '../../../lib/rpg/data/monsters.js';
import { simulateBattle } from '../../../lib/rpg/systems/battleSystem.js';
import { checkLevelUp } from '../../../lib/rpg/systems/levelSystem.js';
import { EMOJI, GAME_CONFIG } from '../../../config/rpg.config.js';

let handler = async (m, { conn, command }) => {
    let user = m.sender;
    let player = await getPlayer(user);
    if (!player) return m.reply('Daftar dulu ketik .register');

    let now = Date.now();
    let cd = player.cooldowns[command] || 0;
    if (now < cd) {
        let rem = Math.ceil((cd - now) / 1000);
        return m.reply(`${EMOJI.COOLDOWN} Tunggu ${rem} detik lagi!`);
    }

    if (command === 'adventure') {
        if (player.resources.energy < 10) return m.reply('Energi tidak cukup! (Butuh 10)');
        let exp = Math.floor(Math.random() * 50) + 20;
        let gold = Math.floor(Math.random() * 100) + 50;
        
        player.exp += exp;
        player.resources.gold += gold;
        player.resources.energy -= 10;
        player.cooldowns.adventure = now + GAME_CONFIG.ADVENTURE_CD;
        
        let lvlUp = checkLevelUp(player);
        await updatePlayer(user, player);
        
        let txt = `🧭 *Adventure Result*\n\n+ ${exp} EXP\n+ ${gold} Gold\n- 10 Energy`;
        if (lvlUp) txt += `\n\n🎊 *LEVEL UP!* Sekarang level *${player.level}*!`;
        return m.reply(txt);
    }

    if (command === 'hunt') {
        if (player.resources.energy < 20) return m.reply('Energi tidak cukup! (Butuh 20)');
        let pool = MONSTERS['forest'];
        if (player.level > 10) pool = MONSTERS['mountain'];
        let monster = { ...pool[Math.floor(Math.random() * pool.length)] };

        let res = simulateBattle(player, monster);
        player.stats.hp = res.remainingHp;
        player.resources.energy -= 20;
        player.cooldowns.hunt = now + GAME_CONFIG.HUNT_CD;

        let txt = `⚔️ *Battle vs ${monster.name}*\n\n`;
        txt += res.logs.slice(-5).join('\n') + '\n\n';

        if (res.win) {
            player.exp += monster.exp;
            player.resources.gold += monster.gold;
            player.progress.monstersKilled++;
            for (let item of res.drops) {
                player.inventory.items[item] = (player.inventory.items[item] || 0) + 1;
            }
            txt += `🏆 *Victory!*\n+ ${monster.exp} EXP\n+ ${monster.gold} Gold\n📦 Drops: ${res.drops.join(', ') || 'None'}`;
            if (checkLevelUp(player)) txt += `\n\n🎊 *LEVEL UP!*`;
        } else {
            txt += `💀 *Defeat!* Kamu kalah.`;
            player.stats.hp = Math.max(10, player.stats.hp);
        }

        await updatePlayer(user, player);
        return m.reply(txt);
    }
};

handler.command = /^(adventure|hunt)$/i;
export default handler;
