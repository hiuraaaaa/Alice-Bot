import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const handler = async (m, { sock, text, isOwner }) => {
    // ✅ Owner only
    if (!isOwner) {
        return await sock.sendMessage(m.key.remoteJid, {
            text: '❌ *Perintah khusus Owner!*\n\n🔒 Anda tidak memiliki akses ke fitur ini.'
        }, { quoted: m });
    }
    
    if (!text) {
        return await sock.sendMessage(m.key.remoteJid, {
            text: `❌ *Masukkan command shell!*\n\n📝 *Contoh:*\n${global.prefix[0]}$ ls -la\n${global.prefix[0]}$ pm2 status\n${global.prefix[0]}$ df -h`
        }, { quoted: m });
    }

    const command = text.trim();

    // Loading message
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, {
        text: `_⏳ Menjalankan command..._\n_🔧 ${command}_`
    }, { quoted: m });

    try {
        const start = Date.now();

        const { stdout, stderr } = await execAsync(command, {
            timeout: 60000, // 60 detik timeout
            maxBuffer: 1024 * 1024 * 10 // 10MB max buffer
        });
        
        let output = stdout || stderr || 'No output';

        // Truncate jika terlalu panjang
        if (output.length > 3000) {
            output = output.substring(0, 3000) + '\n\n... (output dipotong karena terlalu panjang)';
        }

        const time = Date.now() - start;

        const response = `✅ *SHELL EXEC SUCCESS*\n` +
                         `⏱️ Execution Time: ${time}ms\n\n` +
                         `📝 *Command:*\n\`\`\`${command}\`\`\`\n\n` +
                         `📤 *Output:*\n\`\`\`${output}\`\`\``;

        return await sock.sendMessage(m.key.remoteJid, {
            text: response,
            edit: loadingMsg.key
        });

    } catch (error) {
        const time = Date.now() - start;
        
        let errorOutput = error.message;
        if (error.stdout) errorOutput += `\n\nStdout:\n${error.stdout}`;
        if (error.stderr) errorOutput += `\n\nStderr:\n${error.stderr}`;
        
        // Truncate error jika terlalu panjang
        if (errorOutput.length > 3000) {
            errorOutput = errorOutput.substring(0, 3000) + '\n\n... (error dipotong)';
        }

        const errorMsg = `❌ *SHELL EXEC ERROR*\n` +
                         `⏱️ Failed after: ${time}ms\n\n` +
                         `📝 *Command:*\n\`\`\`${command}\`\`\`\n\n` +
                         `⚠️ *Error:*\n\`\`\`${errorOutput}\`\`\``;
        
        return await sock.sendMessage(m.key.remoteJid, {
            text: errorMsg,
            edit: loadingMsg.key
        });
    }
};

// ⭐ ATTACH PROPERTIES
handler.help = ['exec', '$'];
handler.tags = ['owner'];
handler.command = /^(exec|\$)$/i;
handler.owner = true;

export default handler;