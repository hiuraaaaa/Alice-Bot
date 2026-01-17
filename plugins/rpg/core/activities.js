import { getPlayer, updatePlayer } from '../../../lib/rpg/database/playerDB.js';
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

    if (command === 'mining') {
        if (player.resources.energy < 15) return m.reply('Energi tidak cukup! (Butuh 15)');
        let rewards = [
            { id: 'stone', chance: 0.6, count: [1, 5] },
            { id: 'iron_ore', chance: 0.3, count: [1, 3] },
            { id: 'gold_nugget', chance: 0.05, count: [1, 1] }
        ];
        let got = [];
        for (let r of rewards) {
            if (Math.random() < r.chance) {
                let c = Math.floor(Math.random() * (r.count[1] - r.count[0] + 1)) + r.count[0];
                player.inventory.items[r.id] = (player.inventory.items[r.id] || 0) + c;
                got.push(`${c} ${r.id}`);
            }
        }
        player.resources.energy -= 15;
        player.cooldowns.mining = now + 300000; // 5 min
        await updatePlayer(user, player);
        m.reply(`⛏️ Kamu menambang dan mendapatkan: ${got.join(', ') || 'Hanya batu biasa'}`);
    }

    if (command === 'fishing') {
        if (player.resources.energy < 10) return m.reply('Energi tidak cukup! (Butuh 10)');
        let gold = Math.floor(Math.random() * 100) + 50;
        player.resources.gold += gold;
        player.resources.energy -= 10;
        player.cooldowns.fishing = now + 180000; // 3 min
        await updatePlayer(user, player);
        m.reply(`🎣 Kamu memancing dan mendapatkan ikan yang laku dijual seharga ${gold} Gold.`);
    }

    if (command === 'work') {
        let gold = Math.floor(Math.random() * 500) + 200;
        let exp = Math.floor(Math.random() * 100) + 50;
        player.resources.gold += gold;
        player.exp += exp;
        player.cooldowns.work = now + 3600000; // 1 hour
        await updatePlayer(user, player);
        m.reply(`💼 Kamu bekerja keras dan mendapatkan ${gold} Gold dan ${exp} EXP.`);
    }

    if (command === 'daily') {
        let gold = 1000;
        let gems = 5;
        player.resources.gold += gold;
        player.resources.gems += gems;
        player.resources.energy = player.resources.maxEnergy;
        player.cooldowns.daily = now + 86400000; // 24 hours
        await updatePlayer(user, player);
        m.reply(`🎁 *DAILY REWARD*\n\n+ ${gold} Gold\n+ ${gems} Gems\n+ Full Energy!`);
    }
};

handler.command = /^(mining|fishing|work|daily)$/i;
export default handler;
