export const GAME_CONFIG = {
  // LEVELING
  BASE_EXP: 100,
  EXP_CURVE: 1.5,
  MAX_LEVEL: 100,
  
  // STATS PER LEVEL
  HP_PER_LEVEL: 50,
  MP_PER_LEVEL: 10,
  ATK_PER_LEVEL: 5,
  DEF_PER_LEVEL: 3,
  
  // ECONOMY
  STARTING_GOLD: 1000,
  DAILY_GOLD: 500,
  MARKET_TAX: 0.05, // 5%
  MAX_DAILY_EARNINGS: 10000,
  
  // COOLDOWNS (milliseconds)
  ADVENTURE_CD: 300000,    // 5 minutes
  HUNT_CD: 600000,         // 10 minutes
  DUNGEON_CD: 3600000,     // 1 hour
  DAILY_CD: 86400000,      // 24 hours
  
  // ENERGY
  ENERGY_REGEN: 1,         // per 5 minutes
  MAX_ENERGY: 100
};

export const EMOJI = {
  HP: '❤️',
  MP: '💙',
  ATK: '⚔️',
  DEF: '🛡️',
  SPEED: '⚡',
  CRIT: '💥',
  LUCK: '🍀',
  GOLD: '💰',
  GEMS: '💎',
  ENERGY: '⚡',
  EXP: '✨',
  SUCCESS: '✅',
  FAIL: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  COOLDOWN: '⏰'
};
