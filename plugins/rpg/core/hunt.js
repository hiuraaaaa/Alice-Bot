import { getPlayer, updatePlayer } from '../../../lib/rpg/database/playerDB.js';
import { simulateBattle } from '../../../lib/rpg/systems/battleSystem.js';
import { checkLevelUp } from '../../../lib/rpg/systems/levelSystem.js';
import { GAME_CONFIG, EMOJI } from '../../../config/rpg.config.js';

let handler = async (m, { conn }) => {
  let user = m.sender;
  let player = await getPlayer(user);
  
  if (!player) return m.reply('Anda belum terdaftar!');
  
  let now = Date.now();
  if (now < player.cooldowns.hunt) {
    let remaining = Math.ceil((player.cooldowns.hunt - now) / 1000);
    return m.reply(`${EMOJI.COOLDOWN} Tunggu ${remaining} detik lagi untuk berburu!`);
  }

  if (player.resources.energy < 20) return m.reply(`${EMOJI.ENERGY} Energi tidak cukup! (Butuh 20)`);

  // Monster data sederhana
  let monster = {
    name: 'Slime',
    hp: 50 + (player.level * 10),
    stats: { atk: 5 + player.level, def: 2 + player.level, crit: 5 }
  };

  let result = simulateBattle(player, monster);
  
  player.resources.energy -= 20;
  player.cooldowns.hunt = now + GAME_CONFIG.HUNT_CD;
  player.stats.hp = result.remainingHp;

  let text = `⚔️ *Battle vs ${monster.name}*\n\n`;
  text += result.logs.slice(-5).join('\n') + '\n\n';

  if (result.win) {
    let expGained = 100 + (player.level * 10);
    let goldGained = 200 + (player.level * 20);
    
    player.exp += expGained;
    player.resources.gold += goldGained;
    player.progress.monstersKilled += 1;
    
    text += `🏆 *Victory!*\n`;
    text += `${EMOJI.EXP} +${expGained} EXP\n`;
    text += `${EMOJI.GOLD} +${goldGained} Gold\n`;
    
    if (checkLevelUp(player)) {
      text += `🎊 *LEVEL UP!* Sekarang level *${player.level}*!`;
    }
  } else {
    text += `💀 *Defeat!* Anda kalah dalam pertarungan.`;
    player.stats.hp = 10; // Sisa HP minimal
  }

  await updatePlayer(user, player);
  m.reply(text);
};

handler.command = /^(hunt|berburu)$/i;

export default handler;
