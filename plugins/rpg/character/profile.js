import { getPlayer } from '../../../lib/rpg/database/playerDB.js';
import { EMOJI } from '../../../config/rpg.config.js';

let handler = async (m, { conn }) => {
  let user = m.sender;
  let player = await getPlayer(user);
  
  if (!player) return m.reply('Anda belum terdaftar! Ketik *.register <nama>* untuk memulai.');

  let text = `╭━━━『 *RPG PROFILE* 』━━━╮\n\n`;
  text += `👤 *Name:* ${player.name}\n`;
  text += `🎖️ *Class:* ${player.class}\n`;
  text += `🆙 *Level:* ${player.level}\n`;
  text += `${EMOJI.EXP} *EXP:* ${player.exp} / ${player.expToNext}\n\n`;
  
  text += `┌ *Stats*\n`;
  text += `├ ${EMOJI.HP} HP: ${player.stats.hp} / ${player.stats.maxHp}\n`;
  text += `├ ${EMOJI.MP} MP: ${player.stats.mp} / ${player.stats.maxMp}\n`;
  text += `├ ${EMOJI.ATK} ATK: ${player.stats.atk}\n`;
  text += `├ ${EMOJI.DEF} DEF: ${player.stats.def}\n`;
  text += `└ ${EMOJI.SPEED} SPD: ${player.stats.speed}\n\n`;
  
  text += `┌ *Resources*\n`;
  text += `├ ${EMOJI.GOLD} Gold: ${player.resources.gold}\n`;
  text += `├ ${EMOJI.GEMS} Gems: ${player.resources.gems}\n`;
  text += `└ ${EMOJI.ENERGY} Energy: ${player.resources.energy} / ${player.resources.maxEnergy}\n\n`;
  
  text += `╰━━━━━━━━━━━━━━━━━━╯`;

  m.reply(text);
};

handler.command = /^(profile|me|status)$/i;

export default handler;
