import util from 'util';

const handler = async (msg, { sock, reply, text, isOwner }) => {
    if (!isOwner) return reply('❌ Owner only!');
    if (!text) return reply('❌ Kasih code! Contoh: .eval 2+2');
    
    const code = text.trim();
    
    try {
        const start = Date.now();
        
        // Auto-detect jika expression
        let evalCode = code;
        if (!code.includes(';') && 
            !code.startsWith('return ') && 
            !code.startsWith('await ') && 
            !code.includes(' = ') && 
            !code.startsWith('console.')) {
            evalCode = `return ${code}`;
        }
        
        // Eval dengan context
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
        
        // Format output
        let output;
        if (typeof result === 'object' && result !== null) {
            output = util.inspect(result, { depth: 2, colors: false });
        } else {
            output = String(result);
        }
        
        // Truncate if too long
        if (output.length > 1500) {
            output = output.substring(0, 1500) + '... (truncated)';
        }
        
        return reply(`✅ EVAL (${time}ms)\n\n\`\`\`js\n${code.substring(0, 200)}\n\`\`\`\n\n${output}`);
        
    } catch (e) {
        return reply(`❌ EVAL ERROR\n\n${e.message}\n\nCode: ${code.substring(0, 100)}`);
    }
};

// ⭐⭐ ATTACH PROPERTIES KE FUNCTION ⭐⭐
handler.help = ['eval', '>', 'js'];
handler.command = /^(eval|>|js)$/i;
handler.owner = true;

export default handler;