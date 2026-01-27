const aliceHandler = async (m, { sock, reply, text }) => {
    if (!text) {
        return reply(
            `❗ Masukkan operasi matematika\n\n` +
            `Contoh:\n` +
            `• ${global.prefix}calc 2+2\n` +
            `• ${global.prefix}calc 10*5\n` +
            `• ${global.prefix}calc sqrt(16)\n` +
            `• ${global.prefix}calc sin(90)`
        );
    }

    try {
        // Sanitize input
        const sanitized = text
            .replace(/[^0-9+\-*/().√sincostan\s]/g, '')
            .replace(/√/g, 'Math.sqrt')
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan');

        const result = eval(sanitized);

        await reply(
            `🔢 *CALCULATOR*\n\n` +
            `📝 Input: ${text}\n` +
            `✅ Result: ${result}`
        );

        return true;
    } catch (err) {
        console.error(err);
        await reply('❌ Format operasi matematika salah!');
        return false;
    }
};

aliceHandler.help = ["calc", "calculator"];
aliceHandler.tags = ["tools"];
aliceHandler.command = /^(calc|calculator|hitung)$/i;
aliceHandler.limit = false;
aliceHandler.cooldown = 2000;

export default aliceHandler;