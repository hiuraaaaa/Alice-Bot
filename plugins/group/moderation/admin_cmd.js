let handler = async (m, { conn, command, text, args, isGroup }) => {
    if (!isGroup) return m.reply('Hanya bisa di grup!');
    
    // Check if bot is admin
    const metadata = await conn.groupMetadata(m.chat);
    const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
    const isBotAdmin = admins.includes(conn.user.id.split(':')[0] + '@s.whatsapp.net');
    if (!isBotAdmin) return m.reply('Bot harus jadi admin!');

    // Check if sender is admin
    const isAdmin = admins.includes(m.sender);
    if (!isAdmin) return m.reply('Kamu bukan admin!');

    let users = m.mentionedJid[0] ? m.mentionedJid : m.quoted ? [m.quoted.sender] : [text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'];
    if (!users[0]) return m.reply('Tag atau mention user!');

    if (command === 'kick') {
        await conn.groupParticipantsUpdate(m.chat, users, 'remove');
        m.reply('Berhasil mengeluarkan user.');
    } else if (command === 'add') {
        await conn.groupParticipantsUpdate(m.chat, users, 'add');
        m.reply('Berhasil menambahkan user.');
    } else if (command === 'promote') {
        await conn.groupParticipantsUpdate(m.chat, users, 'promote');
        m.reply('Berhasil menjadikan admin.');
    } else if (command === 'demote') {
        await conn.groupParticipantsUpdate(m.chat, users, 'demote');
        m.reply('Berhasil menurunkan jabatan admin.');
    }
};

handler.command = /^(kick|add|promote|demote)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
