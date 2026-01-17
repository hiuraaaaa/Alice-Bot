export const QUESTS = [
    { id: 'newbie_1', title: 'First Steps', description: 'Bunuh 5 monster.', target: { type: 'kill', count: 5 }, rewards: { gold: 500, exp: 200 } },
    { id: 'newbie_2', title: 'Gatherer', description: 'Kumpulkan 10 Wood.', target: { type: 'collect', item: 'wood', count: 10 }, rewards: { gold: 1000, exp: 500 } },
    { id: 'warrior_1', title: 'Dungeon Crawler', description: 'Selesaikan 3 Dungeon.', target: { type: 'dungeon', count: 3 }, rewards: { gold: 5000, exp: 2000, item: 'magic_crystal' } }
];

export function checkQuestProgress(player, type, data) {
    if (!player.activeQuests) player.activeQuests = {};
    
    for (const [questId, progress] of Object.entries(player.activeQuests)) {
        const quest = QUESTS.find(q => q.id === questId);
        if (!quest) continue;

        if (quest.target.type === type) {
            if (type === 'kill') progress.current++;
            if (type === 'collect' && data.item === quest.target.item) progress.current += data.count;
            if (type === 'dungeon') progress.current++;
        }
    }
}

export function claimQuest(player, questId) {
    const progress = player.activeQuests[questId];
    const quest = QUESTS.find(q => q.id === questId);
    
    if (!progress || !quest) return { success: false, message: 'Quest tidak aktif!' };
    if (progress.current < quest.target.count) return { success: false, message: 'Quest belum selesai!' };

    // Give rewards
    player.resources.gold += quest.rewards.gold;
    player.exp += quest.rewards.exp;
    if (quest.rewards.item) {
        player.inventory.items[quest.rewards.item] = (player.inventory.items[quest.rewards.item] || 0) + 1;
    }

    delete player.activeQuests[questId];
    player.progress.questsCompleted++;

    return { 
        success: true, 
        message: `Quest *${quest.title}* selesai! Mendapatkan ${quest.rewards.gold} Gold dan ${quest.rewards.exp} EXP.` 
    };
}
