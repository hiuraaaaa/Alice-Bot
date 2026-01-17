import { getGroup, updateGroup } from '../../../lib/group/groupSystem.js';

let handler = async (m, { conn, command, text, args, isGroup }) => {
    if (!isGroup) return m.reply('Hanya bisa di grup!');
    
    const metadata = await conn.groupMetadata(m.chat);
    const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
    const isAdmin = admins.includes(m.sender);
    if (!isAdmin) return m.reply('Kamu bukan admin!');

    let groupData = await getGroup(m.chat);

    if (command === 'antilink') {
        if (!args[0]) return m.reply('Gunakan on/off. Contoh: .antilink on');
        let status = args[0].toLowerCase() === 'on';
        groupData.antilink.enabled = status;
        await updateGroup(m.chat, groupData);
        m.reply(`Anti-link berhasil di${status ? 'aktifkan' : 'matikan'}.`);
    } else if (command === 'welcome') {
        if (!args[0]) return m.reply('Gunakan on/off. Contoh: .welcome on');
        let status = args[0].toLowerCase() === 'on';
        groupData.welcome.enabled = status;
        await updateGroup(m.chat, groupData);
        m.reply(`Welcome message berhasil di${status ? 'aktifkan' : 'matikan'}.`);
    } else if (command === 'setwelcome') {
        if (!text) return m.reply('Masukkan pesan welcome!\nVariabel: @user, {group}, {count}');
        groupData.welcome.message = text;
        await updateGroup(m.chat, groupData);
        m.reply('Pesan welcome berhasil diubah.');
    }
};

handler.command = /^(antilink|welcome|setwelcome)$/i;
handler.group = true;
handler.admin = true;

export default handler;
