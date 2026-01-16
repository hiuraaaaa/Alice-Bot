import util from 'util';

const aliceHandler = async (msg, { sock, reply, text, isOwner }) => {
    if (!isOwner) return reply(global.mess.owner);
    if (!text) {
        return reply(`❗ Masukkan code JavaScript\nContoh: ${global.prefix}eval 2+2`);
    }
    
    const code = text.trim();
    
    try {
        const start = Date.now();
        
        let evalCode = code;
        if (!code.includes(';') && 
            !code.startsWith('return ') && 
            !code.startsWith('await ') && 
            !code.includes(' = ') && 
            !code.startsWith('console.')) {
            evalCode = `return ${code}`;
        }
        
        const result = await eval(`
            (async () => {
                try {
                    ${evalCode}
                } catch(e) {
                    return "ERROR: " + e.message + "\\n" + e.stack;
                }
            })()
        `);
        
        const time = Date.now() - start;
        
        let output;
        if (typeof result === 'object' && result !== null) {
            output = util.inspect(result, { depth: 2, colors: false });
        } else {
            output = String(result);
        }
        
        if (output.length > 1500) {
            output = output.substring(0, 1500) + '... (truncated)';
        }
        
        return reply(`✅ *EVAL* (${time}ms)\n\n\`\`\`js\n${code.substring(0, 200)}\n\`\`\`\n\n${output}`);
        
    } catch (err) {
        return reply(`❌ *EVAL ERROR*\n\n${err.message}\n\nCode: ${code.substring(0, 100)}`);
    }
};

aliceHandler.help = ["eval", ">", "js"];
aliceHandler.tags = ["owner"];
aliceHandler.command = /^(eval|>|js)$/i;
aliceHandler.owner = true;
aliceHandler.limit = false;

export default aliceHandler;
