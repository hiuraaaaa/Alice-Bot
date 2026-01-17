import { getGroup } from '../../../lib/group/groupSystem.js';

let handler = async (m, { conn, isGroup }) => {
  if (!isGroup) return m.reply('Perintah ini hanya bisa digunakan di dalam grup!');
  
  let groupMetadata = await conn.groupMetadata(m.chat);
  let groupData = await getGroup(m.chat);
  
  let text = `╭━━━『 *GROUP INFO* 』━━━╮\n\n`;
  text += `📝 *Name:* ${groupMetadata.subject}\n`;
  text += `🆔 *ID:* ${m.chat}\n`;
  text += `👥 *Members:* ${groupMetadata.participants.length}\n`;
  text += `👑 *Owner:* @${groupMetadata.owner?.split('@')[0] || 'Tidak diketahui'}\n\n`;
  
  text += `┌ *Settings*\n`;
  text += `├ 🚪 Welcome: ${groupData.welcome.enabled ? '✅' : '❌'}\n`;
  text += `├ 🚪 Goodbye: ${groupData.goodbye.enabled ? '✅' : '❌'}\n`;
  text += `├ 🔗 Anti-Link: ${groupData.antilink.enabled ? '✅' : '❌'}\n`;
  text += `└ 🎮 RPG Mode: ${groupData.rpg.enabled ? '✅' : '❌'}\n\n`;
  
  text += `╰━━━━━━━━━━━━━━━━━━╯`;

  conn.sendMessage(m.chat, { text, mentions: [groupMetadata.owner] }, { quoted: m });
};

handler.command = /^(groupinfo|gcinfo|infogrup)$/i;

export default handler;
