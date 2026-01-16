import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// ===============================
// 🔧 KONFIGURASI UTAMA
// ===============================
global.owner = ['6283821920285', '183455837110471'];
global.botNumber = '62882006639544';
global.ownerName = 'Xiao';
global.botName = 'Alice Assistant';
global.prefix = '.';
global.isPublic = true;

// ===============================
// 👑 PREMIUM USERS
// ===============================
global.premium = ['62882006639544'];

// ===============================
// 🔋 LIMIT & COOLDOWN
// ===============================
global.defaultLimits = {
    user: 20,
    premium: 9999
};

global.cooldownTime = 3000;

// ===============================
// 🔥 PESAN SYSTEM
// ===============================
global.mess = {
    wait: 'Sedang diproses...',
    owner: 'Fitur ini hanya untuk Owner!',
    group: 'Fitur ini hanya untuk Grup!',
    private: 'Fitur ini hanya untuk Chat Pribadi!',
    admin: 'Fitur ini hanya untuk Admin Grup!',
    botAdmin: 'Bot harus menjadi admin untuk menggunakan fitur ini!',
    limit: 'Limit harian kamu sudah habis! 🚫\nSilakan tunggu sampai reset jam 00:00.',
    premium: '👑 Fitur ini hanya untuk Premium Users!\n\n💎 Upgrade ke premium untuk akses unlimited!\nHubungi owner untuk info lebih lanjut.'
};

// ===============================
// 🖼️ BANNER MENU
// ===============================
global.bannerUrl = 'https://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/1767965339176.jpg';

// ===============================
// 🎯 PREMIUM CONFIG
// ===============================
global.premiumConfig = {
    cooldownReduction: 0.5,
    unlimitedLimit: true,
    skipAntiSpam: true
};

// ===============================
// 🔁 AUTO-RELOAD
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fs.watchFile(__filename, () => {
    console.log(`[UPDATE] settings.js updated!`);
});
