import { Database } from '../utils/db.js';

const db = new Database('groups.json');

export async function getGroup(groupId) {
  const data = await db.load();
  if (!data[groupId]) {
    data[groupId] = {
      groupId,
      name: '',
      welcome: { enabled: true, message: 'Selamat datang @user di *{group}*!', type: 'text' },
      goodbye: { enabled: true, message: 'Goodbye @user 👋', type: 'text' },
      antilink: { enabled: false, action: 'kick' },
      antispam: { enabled: false },
      rpg: { enabled: true }
    };
    await db.save();
  }
  return data[groupId];
}

export async function updateGroup(groupId, updates) {
  const data = await db.load();
  data[groupId] = { ...data[groupId], ...updates };
  await db.save();
  return data[groupId];
}
