import fs from 'fs';

const aliceHandler = async (m, { sock, reply }) => {
    return reply('Logger system aktif!');
};

aliceHandler.all = async (m, { sender, from, body, isCmd, commandText }) => {
    const timestamp = new Date().toLocaleString('id-ID');
    const chat = from.endsWith('@g.us') ? 'GROUP' : 'PRIVATE';
    const type = isCmd ? `COMMAND: ${commandText}` : 'MESSAGE';
    
    // Log ke console
    console.log(`[${timestamp}] [${chat}] [${type}] ${sender}: ${body}`);
    
    // Save ke file (optional)
    const log = `[${timestamp}] [${chat}] [${type}] ${sender}: ${body}\n`;
    fs.appendFileSync('logs/messages.txt', log);
};

aliceHandler.command = /^(logger)$/i;
export default aliceHandler;