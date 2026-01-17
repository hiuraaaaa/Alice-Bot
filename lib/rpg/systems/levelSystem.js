import { GAME_CONFIG } from '../../../config/rpg.config.js';

export function calculateExpToNext(level) {
  return Math.floor(GAME_CONFIG.BASE_EXP * Math.pow(level, GAME_CONFIG.EXP_CURVE));
}

export function checkLevelUp(player) {
  let leveledUp = false;
  while (player.exp >= player.expToNext && player.level < GAME_CONFIG.MAX_LEVEL) {
    player.exp -= player.expToNext;
    player.level++;
    player.expToNext = calculateExpToNext(player.level);
    
    // Increase stats
    player.stats.maxHp += GAME_CONFIG.HP_PER_LEVEL;
    player.stats.hp = player.stats.maxHp;
    player.stats.maxMp += GAME_CONFIG.MP_PER_LEVEL;
    player.stats.mp = player.stats.maxMp;
    player.stats.atk += GAME_CONFIG.ATK_PER_LEVEL;
    player.stats.def += GAME_CONFIG.DEF_PER_LEVEL;
    
    leveledUp = true;
  }
  return leveledUp;
}
