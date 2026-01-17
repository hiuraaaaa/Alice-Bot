import { ITEMS } from '../data/items.js';

export const RECIPES = {
    'iron_sword': { materials: { 'iron_ore': 5, 'wood': 2 }, gold: 200 },
    'steel_blade': { materials: { 'iron_ore': 15, 'magic_crystal': 1 }, gold: 1000 },
    'chainmail': { materials: { 'iron_ore': 10, 'leather_vest': 1 }, gold: 800 },
    'dragon_slayer': { materials: { 'dragon_bone': 10, 'steel_blade': 1, 'magic_crystal': 5 }, gold: 20000 },
    'small_hp_potion': { materials: { 'wood': 1 }, gold: 20 }
};

export function craftItem(player, targetItemId) {
    const recipe = RECIPES[targetItemId];
    if (!recipe) return { success: false, message: 'Resep tidak ditemukan!' };

    if (player.resources.gold < recipe.gold) {
        return { success: false, message: `Gold tidak cukup! Butuh ${recipe.gold} Gold.` };
    }

    for (const [mat, count] of Object.entries(recipe.materials)) {
        if ((player.inventory.items[mat] || 0) < count) {
            return { success: false, message: `Material tidak cukup! Butuh ${count} ${ITEMS[mat].name}.` };
        }
    }

    // Deduct materials and gold
    player.resources.gold -= recipe.gold;
    for (const [mat, count] of Object.entries(recipe.materials)) {
        player.inventory.items[mat] -= count;
        if (player.inventory.items[mat] === 0) delete player.inventory.items[mat];
    }

    // Add item
    player.inventory.items[targetItemId] = (player.inventory.items[targetItemId] || 0) + 1;

    return { 
        success: true, 
        message: `Berhasil membuat *${ITEMS[targetItemId].name}*!`,
        item: ITEMS[targetItemId]
    };
}
