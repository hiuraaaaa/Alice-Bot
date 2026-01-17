export function calculateDamage(attacker, defender) {
  const baseDamage = (attacker.stats.atk * 1) - (defender.stats.def * 0.5);
  const isCrit = Math.random() * 100 < attacker.stats.crit;
  const multiplier = isCrit ? 2 : 1;
  
  const finalDamage = Math.max(1, Math.floor(baseDamage * multiplier));
  return {
    damage: finalDamage,
    isCrit
  };
}

export function simulateBattle(player, monster) {
  let playerHp = player.stats.hp;
  let monsterHp = monster.hp;
  const logs = [];

  while (playerHp > 0 && monsterHp > 0) {
    // Player attacks
    const pAtk = calculateDamage(player, monster);
    monsterHp -= pAtk.damage;
    logs.push(`Player deals ${pAtk.damage} damage ${pAtk.isCrit ? '(CRIT!)' : ''}`);

    if (monsterHp <= 0) break;

    // Monster attacks
    const mAtk = calculateDamage(monster, player);
    playerHp -= mAtk.damage;
    logs.push(`Monster deals ${mAtk.damage} damage ${mAtk.isCrit ? '(CRIT!)' : ''}`);
  }

  return {
    win: playerHp > 0,
    logs,
    remainingHp: Math.max(0, playerHp)
  };
}
