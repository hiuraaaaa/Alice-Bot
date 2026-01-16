import os from 'os';
import osu from 'node-os-utils';

const cpu = osu.cpu;
const mem = osu.mem;
const drive = osu.drive;
const osUtil = osu.os;

const robin = async (m, { sock }) => {
    const sender = m?.sender || m?.key?.participant || "0@s.whatsapp.net";

    // RAM
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Drive & CPU
    const memInfo = await mem.info();
    const driveInfo = await drive.info();
    const cpuModel = os.cpus()[0].model;
    const uptimeOS = os.uptime();
    const runtime = process.uptime();

    const message = `╭─[⚙️ SYSTEM INFO]
│ 🖥️ OS       : ${osUtil.platform()} ${os.release()}
│ 🧠 RAM      : ${progressBar(usedMem, totalMem)} ${formatGB(usedMem)} / ${formatGB(totalMem)} GB
│ 💽 Storage  : ${progressBar(driveInfo.usedGb, driveInfo.totalGb)} ${driveInfo.usedGb} / ${driveInfo.totalGb} GB
│ 🔧 CPU      : ${await cpu.count()} Cores (${cpuModel})
│ ⏱️ Uptime   : ${formatTime(uptimeOS)}
│ 📆 Runtime  : ${Math.floor(runtime / 3600)}h
╰────────────────────────`;

    try {
        await sock.sendMessage(
            m.key?.remoteJid || sender,
            { text: message, mentions: [sender] }
        );
    } catch (err) {
        console.error("Error kirim system info:", err);
    }
};

robin.command = [/^(os|server)$/i];
robin.help = ['os', 'server'];
robin.tags = ['run'];

function formatGB(bytes) {
    return (bytes / (1024 ** 3)).toFixed(2);
}

function progressBar(used, total, length = 10) {
    const percent = used / total;
    const filled = Math.round(percent * length);
    return `[${'█'.repeat(filled)}${'░'.repeat(length - filled)}]`;
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default robin;