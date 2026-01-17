import { ITEMS } from '../data/items.js';

export function calculateDamage(attacker, defender) {
    // Attacker can be player or monster
    const atk = attacker.stats?.atk || attacker.atk;
    const def = defender.stats?.def || defender.def;
    const crit = attacker.stats?.crit || attacker.crit || 0;

    let baseDamage = atk - (def * 0.5);
    const isCrit = Math.random() * 100 < crit;
    const multiplier = isCrit ? 2 : 1;
    
    const finalDamage = Math.max(1, Math.floor(baseDamage * multiplier * (0.9 + Math.random() * 0.2)));
    return {
        damage: finalDamage,
        isCrit
    };
}

export function simulateBattle(player, monster) {
    let playerHp = player.stats.hp;
    let monsterHp = monster.hp;
    const logs = [];
    let turn = 1;

    while (playerHp > 0 && monsterHp > 0 && turn <= 50) {
        // Player attacks
        const pAtk = calculateDamage(player, monster);
        monsterHp -= pAtk.damage;
        logs.push(`Turn ${turn}: Player deals ${pAtk.damage} damage ${pAtk.isCrit ? '💥' : ''}`);

        if (monsterHp <= 0) break;

        // Monster attacks
        const mAtk = calculateDamage(monster, player);
        playerHp -= mAtk.damage;
        logs.push(`Turn ${turn}: ${monster.name} deals ${mAtk.damage} damage ${mAtk.isCrit ? '💥' : ''}`);

        // Auto-heal logic if player has potions (simplified for simulation)
        if (playerHp < player.stats.maxHp * 0.2 && player.inventory.items['small_hp_potion'] > 0) {
            playerHp += ITEMS['small_hp_potion'].heal;
            player.inventory.items['small_hp_potion']--;
            logs.push(`Player uses Small HP Potion! ❤️ +${ITEMS['small_hp_potion'].heal} HP`);
        }

        turn++;
    }

    const win = monsterHp <= 0;
    const drops = [];
    if (win && monster.drops) {
        for (const drop of monster.drops) {
            if (Math.random() < drop.chance) {
                drops.push(drop.item);
            }
        }
    }

    return {
        win,
        logs,
        remainingHp: Math.max(0, Math.floor(playerHp)),
        monsterRemainingHp: Math.max(0, Math.floor(monsterHp)),
        drops,
        turns: turn
    };
}
