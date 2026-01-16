import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// ===============================
// 🔧 KONFIGURASI UTAMA
// ===============================
global.owner = ['6283821920285', '183455837110471']; // Nomor owner
global.botNumber = '62882006639544'; // Nomor bot
global.ownerName = 'Xiao';
global.botName = 'Alice Assistant';
global.prefix = '.';
global.isPublic = true; // Mode bot

// ===============================
// 👑 PREMIUM USERS (PURE ARRAY!)
// ===============================
global.premium = [
       '62882006639544',
    // '628987654321'
]; // Kosongkan atau isi dengan nomor premium users

// ===============================
// 🔋 LIMIT & COOLDOWN DEFAULT
// ===============================
global.defaultLimits = {
    user: 20,         // Limit harian user biasa
    premium: 9999     // Limit premium (unlimited)
};

global.cooldownTime = 3000; // Default cooldown jika plugin tidak set sendiri (3 detik)

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
    premium: '👑 Fitur ini hanya untuk Premium Users!\n\n💎 Upgrade ke premium untuk akses unlimited!\nHubungi owner untuk info lebih lanjut.',
};

// ===============================
// 🖼️ BANNER MENU
// ===============================
global.bannerUrl = 'https://nc-cdn.oss-us-west-1.aliyuncs.com/nekoo/1767965339176.jpg';

// ===============================
// 🎯 PREMIUM CONFIG (OPTIONAL)
// ===============================
global.premiumConfig = {
    cooldownReduction: 0.5,  // Premium dapat 50% cooldown reduction
    unlimitedLimit: true,     // Premium unlimited limit
    skipAntiSpam: true        // Premium skip anti-spam check
};

// ===============================
// 🔁 AUTO-RELOAD SETTINGS
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let file = __filename;

fs.watchFile(file, () => {
    console.log(`[UPDATE] settings.js updated!`);
});
