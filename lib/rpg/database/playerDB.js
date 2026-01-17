import { Database } from '../../utils/db.js';
import { GAME_CONFIG } from '../../../config/rpg.config.js';

const db = new Database('rpg_players.json');

export async function getPlayer(userId) {
    const data = await db.load();
    if (!data.players) data.players = {};
    return data.players[userId];
}

export async function createPlayer(userId, name) {
    const data = await db.load();
    if (!data.players) data.players = {};
    if (data.players[userId]) return data.players[userId];

    const newPlayer = {
        userId,
        name,
        class: 'Novice',
        level: 1,
        exp: 0,
        expToNext: GAME_CONFIG.BASE_EXP,
        prestige: 0,
        stats: {
            hp: 100,
            maxHp: 100,
            mp: 20,
            maxMp: 20,
            atk: 10,
            def: 5,
            speed: 10,
            crit: 5,
            luck: 5
        },
        resources: {
            gold: GAME_CONFIG.STARTING_GOLD,
            gems: 0,
            energy: GAME_CONFIG.MAX_ENERGY,
            maxEnergy: GAME_CONFIG.MAX_ENERGY
        },
        inventory: {
            weapon: null,
            armor: null,
            accessory: null,
            items: {
                'small_hp_potion': 5,
                'wooden_sword': 1
            }
        },
        skills: {},
        activeQuests: {},
        progress: {
            questsCompleted: 0,
            monstersKilled: 0,
            dungeonsCleared: 0,
            pvpWins: 0,
            pvpLosses: 0
        },
        cooldowns: {
            adventure: 0,
            hunt: 0,
            daily: 0,
            dungeon: 0,
            mining: 0,
            fishing: 0,
            work: 0
        },
        createdAt: Date.now(),
        lastActive: Date.now()
    };

    data.players[userId] = newPlayer;
    await db.save();
    return newPlayer;
}

export async function updatePlayer(userId, updates) {
    const data = await db.load();
    if (!data.players[userId]) return null;
    
    data.players[userId] = { ...data.players[userId], ...updates };
    await db.save();
    return data.players[userId];
}

export async function getAllPlayers() {
    const data = await db.load();
    return data.players || {};
}
