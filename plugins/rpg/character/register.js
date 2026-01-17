import { createPlayer, getPlayer } from '../../../lib/rpg/database/playerDB.js';

let handler = async (m, { conn, text }) => {
  let user = m.sender;
  let player = await getPlayer(user);
  
  if (player) return m.reply('Anda sudah terdaftar dalam sistem RPG!');
  if (!text) return m.reply('Masukkan nama karakter Anda!\nContoh: .register Alice');

  await createPlayer(user, text);
  m.reply(`Selamat datang *${text}*! Karakter Anda telah berhasil dibuat.\nKetik *.profile* untuk melihat status Anda.`);
};

handler.command = /^(rpg-register|daftar-rpg|register)$/i;

export default handler;
