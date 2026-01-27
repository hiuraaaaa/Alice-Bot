import similarity from 'similarity';

const handler = async (m, { reply, text }) => {
    if (!text) return reply('Contoh: .test mennu menu');
    
    const [word1, word2] = text.split(' ');
    const sim = similarity(word1, word2);
    const percent = parseInt(sim * 100);
    
    return reply(`Kemiripan "${word1}" dengan "${word2}": ${percent}%`);
};

handler.command = /^test33$/i;
export default handler;