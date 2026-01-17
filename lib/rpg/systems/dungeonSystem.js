import { MONSTERS } from '../data/monsters.js';
import { simulateBattle } from './battleSystem.js';

export const DUNGEONS = [
    { id: 'goblin_cave', name: 'Goblin Cave', minLevel: 1, stages: 3, monsterPool: 'forest', energy: 30 },
    { id: 'wolf_mountain', name: 'Wolf Mountain', minLevel: 10, stages: 5, monsterPool: 'mountain', energy: 50 },
    { id: 'dark_castle', name: 'Dark Castle', minLevel: 25, stages: 10, monsterPool: 'dungeon', energy: 100 }
];

export async function enterDungeon(player, dungeonId) {
    const dungeon = DUNGEONS.find(d => d.id === dungeonId);
    if (!dungeon) return { success: false, message: 'Dungeon tidak ditemukan!' };
    if (player.level < dungeon.minLevel) return { success: false, message: `Level minimal: ${dungeon.minLevel}` };
    if (player.resources.energy < dungeon.energy) return { success: false, message: `Energi tidak cukup! Butuh ${dungeon.energy}` };

    player.resources.energy -= dungeon.energy;
    const logs = [`🏰 Memasuki Dungeon: *${dungeon.name}*`];
    let currentStage = 1;
    let totalGold = 0;
    let totalExp = 0;
    let allDrops = [];

    while (currentStage <= dungeon.stages) {
        const pool = MONSTERS[dungeon.monsterPool];
        const monster = { ...pool[Math.floor(Math.random() * pool.length)] };
        
        // Scale monster for dungeon
        monster.hp = Math.floor(monster.hp * (1 + currentStage * 0.1));
        monster.atk = Math.floor(monster.atk * (1 + currentStage * 0.05));

        const result = simulateBattle(player, monster);
        player.stats.hp = result.remainingHp;

        if (!result.win) {
            logs.push(`❌ Kalah di Stage ${currentStage} melawan ${monster.name}.`);
            break;
        }

        totalGold += monster.gold;
        totalExp += monster.exp;
        allDrops = allDrops.concat(result.drops);
        logs.push(`✅ Stage ${currentStage}: Mengalahkan ${monster.name}`);
        
        currentStage++;
    }

    const cleared = currentStage > dungeon.stages;
    if (cleared) {
        player.progress.dungeonsCleared++;
        logs.push(`🏆 *DUNGEON CLEARED!*`);
    }

    return {
        success: true,
        cleared,
        logs,
        rewards: { gold: totalGold, exp: totalExp, drops: allDrops }
    };
}
