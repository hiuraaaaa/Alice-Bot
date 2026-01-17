export const MONSTERS = {
    'forest': [
        { name: 'Slime', level: 1, hp: 30, atk: 5, def: 2, exp: 15, gold: 10, drops: [{ item: 'small_hp_potion', chance: 0.1 }] },
        { name: 'Wild Rabbit', level: 2, hp: 45, atk: 8, def: 3, exp: 25, gold: 15, drops: [{ item: 'wood', chance: 0.2 }] },
        { name: 'Goblin', level: 5, hp: 100, atk: 15, def: 5, exp: 60, gold: 40, drops: [{ item: 'iron_ore', chance: 0.1 }, { item: 'iron_sword', chance: 0.01 }] }
    ],
    'mountain': [
        { name: 'Wolf', level: 8, hp: 180, atk: 25, def: 10, exp: 120, gold: 80, drops: [{ item: 'leather_vest', chance: 0.05 }] },
        { name: 'Harpy', level: 12, hp: 300, atk: 45, def: 15, exp: 250, gold: 150, drops: [{ item: 'magic_crystal', chance: 0.02 }] },
        { name: 'Stone Golem', level: 15, hp: 600, atk: 35, def: 50, exp: 400, gold: 250, drops: [{ item: 'stone', chance: 0.5 }, { item: 'iron_ore', chance: 0.2 }] }
    ],
    'dungeon': [
        { name: 'Skeleton Warrior', level: 20, hp: 800, atk: 80, def: 40, exp: 800, gold: 500, drops: [{ item: 'steel_blade', chance: 0.02 }] },
        { name: 'Dark Mage', level: 25, hp: 1200, atk: 150, def: 30, exp: 1500, gold: 1000, drops: [{ item: 'mana_potion', chance: 0.3 }, { item: 'magic_crystal', chance: 0.1 }] },
        { name: 'Dungeon Boss: Cerberus', level: 35, hp: 5000, atk: 300, def: 150, exp: 10000, gold: 5000, drops: [{ item: 'dragon_bone', chance: 0.5 }, { item: 'plate_armor', chance: 0.1 }] }
    ],
    'void': [
        { name: 'Void Stalker', level: 50, hp: 15000, atk: 800, def: 400, exp: 50000, gold: 20000, drops: [{ item: 'void_edge', chance: 0.001 }] },
        { name: 'Ancient Dragon', level: 70, hp: 50000, atk: 2000, def: 1000, exp: 200000, gold: 100000, drops: [{ item: 'dragon_scale', chance: 0.1 }, { item: 'dragon_slayer', chance: 0.05 }] }
    ]
};
