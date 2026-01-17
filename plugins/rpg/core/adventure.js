import { getPlayer, updatePlayer } from '../../../lib/rpg/database/playerDB.js';
import { checkLevelUp } from '../../../lib/rpg/systems/levelSystem.js';
import { GAME_CONFIG, EMOJI } from '../../../config/rpg.config.js';

let handler = async (m, { conn }) => {
  let user = m.sender;
  let player = await getPlayer(user);
  
  if (!player) return m.reply('Anda belum terdaftar!');
  
  let now = Date.now();
  if (now < player.cooldowns.adventure) {
    let remaining = Math.ceil((player.cooldowns.adventure - now) / 1000);
    return m.reply(`${EMOJI.COOLDOWN} Tunggu ${remaining} detik lagi untuk berpetualang!`);
  }

  if (player.resources.energy < 10) return m.reply(`${EMOJI.ENERGY} Energi tidak cukup! (Butuh 10)`);

  // Logic petualangan sederhana
  let expGained = Math.floor(Math.random() * 50) + 20;
  let goldGained = Math.floor(Math.random() * 100) + 50;
  
  player.exp += expGained;
  player.resources.gold += goldGained;
  player.resources.energy -= 10;
  player.cooldowns.adventure = now + GAME_CONFIG.ADVENTURE_CD;

  let leveledUp = checkLevelUp(player);
  
  await updatePlayer(user, player);

  let text = `🧭 *Adventure Result*\n\n`;
  text += `Anda berpetualang dan mendapatkan:\n`;
  text += `${EMOJI.EXP} +${expGained} EXP\n`;
  text += `${EMOJI.GOLD} +${goldGained} Gold\n`;
  text += `${EMOJI.ENERGY} -10 Energy\n\n`;
  
  if (leveledUp) {
    text += `🎊 *LEVEL UP!* 🎊\nSekarang Anda level *${player.level}*!`;
  }

  m.reply(text);
};

handler.command = /^(adventure|petualang)$/i;

export default handler;
