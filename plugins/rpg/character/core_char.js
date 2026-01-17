import { createPlayer, getPlayer, updatePlayer } from '../../../lib/rpg/database/playerDB.js';
import { EMOJI } from '../../../config/rpg.config.js';
import { ITEMS } from '../../../lib/rpg/data/items.js';

let handler = async (m, { conn, command, text }) => {
    let user = m.sender;
    let player = await getPlayer(user);

    if (command === 'register') {
        if (player) return m.reply('Kamu sudah terdaftar!');
        if (!text) return m.reply('Masukkan nama! Contoh: .register Alice');
        await createPlayer(user, text.trim());
        return m.reply(`Selamat datang *${text}*! Ketik .menu untuk melihat fitur RPG.`);
    }

    if (!player) return m.reply('Daftar dulu ketik .register');

    if (command === 'profile' || command === 'me') {
        let txt = `╭━━━『 *RPG PROFILE* 』━━━╮\n\n`;
        txt += `👤 *Name:* ${player.name}\n`;
        txt += `🎖️ *Class:* ${player.class}\n`;
        txt += `🆙 *Level:* ${player.level}\n`;
        txt += `${EMOJI.EXP} *EXP:* ${player.exp} / ${player.expToNext}\n\n`;
        
        txt += `┌ *Stats*\n`;
        txt += `├ ${EMOJI.HP} HP: ${player.stats.hp} / ${player.stats.maxHp}\n`;
        txt += `├ ${EMOJI.MP} MP: ${player.stats.mp} / ${player.stats.maxMp}\n`;
        txt += `├ ${EMOJI.ATK} ATK: ${player.stats.atk}\n`;
        txt += `├ ${EMOJI.DEF} DEF: ${player.stats.def}\n`;
        txt += `└ ${EMOJI.SPEED} SPD: ${player.stats.speed}\n\n`;
        
        txt += `┌ *Resources*\n`;
        txt += `├ ${EMOJI.GOLD} Gold: ${player.resources.gold}\n`;
        txt += `├ ${EMOJI.GEMS} Gems: ${player.resources.gems}\n`;
        txt += `└ ${EMOJI.ENERGY} Energy: ${player.resources.energy} / ${player.resources.maxEnergy}\n\n`;
        
        txt += `╰━━━━━━━━━━━━━━━━━━╯`;
        return m.reply(txt);
    }

    if (command === 'stats') {
        let txt = `📊 *DETAILED STATS - ${player.name}*\n\n`;
        txt += `⚔️ Weapon: ${player.inventory.weapon ? ITEMS[player.inventory.weapon].name : 'None'}\n`;
        txt += `🛡️ Armor: ${player.inventory.armor ? ITEMS[player.inventory.armor].name : 'None'}\n\n`;
        txt += `📈 Progress:\n`;
        txt += `- Quests: ${player.progress.questsCompleted}\n`;
        txt += `- Kills: ${player.progress.monstersKilled}\n`;
        txt += `- Dungeons: ${player.progress.dungeonsCleared}\n`;
        txt += `- PvP Wins: ${player.progress.pvpWins}\n`;
        return m.reply(txt);
    }
};

handler.command = /^(register|profile|me|stats)$/i;
export default handler;
