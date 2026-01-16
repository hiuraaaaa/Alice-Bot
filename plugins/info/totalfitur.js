const handler = async (m, { sock, reply }) => {
  try {
    if (!global.plugins) return reply("❌ No plugins loaded.");

    // Hitung total plugin
    const total = Object.keys(global.plugins).length;

    // Buat daftar plugin aktif (opsional)
    const pluginList = Object.keys(global.plugins).map((p, i) => `${i + 1}. ${p}`).join('\n');

    const caption = `
✅ Total Active Features: ${total}

📌 List of Features:
${pluginList}
    `.trim();

    await reply(caption);

  } catch (err) {
    console.error("[TOTALFITUR ERROR]", err);
    await reply("❌ An error occurred while counting features.");
  }
};

handler.help = ["totalfitur"];
handler.tags = ["tools", "info"];
handler.command = /^(totalfitur|features)$/i;

export default handler;