import fs from "fs";
import path from "path";

const managePluginHandler = async (m, { sock }) => {
    const baseDir = path.join(process.cwd(), "plugins");

    // Fungsi rekursif untuk membangun tree folder
    const buildTree = (dir, prefix = "") => {
        let tree = "";
        const items = fs.readdirSync(dir);
        const folders = items.filter(i => fs.statSync(path.join(dir, i)).isDirectory());
        const files = items.filter(i => fs.statSync(path.join(dir, i)).isFile() && i.endsWith(".js"));

        folders.forEach((folder, idx) => {
            const isLast = idx === folders.length - 1 && files.length === 0;
            tree += `${prefix}${isLast ? "└─ " : "├─ "}📁 ${folder}/\n`;
            tree += buildTree(path.join(dir, folder), prefix + (isLast ? "   " : "│  "));
        });

        files.forEach((file, idx) => {
            const isLast = idx === files.length - 1;
            tree += `${prefix}${isLast ? "└─ " : "├─ "}📄 ${file}\n`;
        });

        return tree;
    };

    // Hitung statistik
    const countItems = (dir) => {
        let folders = 0;
        let files = 0;

        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                folders++;
                const sub = countItems(fullPath);
                folders += sub.folders;
                files += sub.files;
            } else if (item.endsWith(".js")) {
                files++;
            }
        }

        return { folders, files };
    };

    const stats = countItems(baseDir);
    const total = stats.folders + stats.files;

    const treeMsg = `📊 *Plugin Statistics:*\n` +
                    `├─ 📁 Folders: ${stats.folders}\n` +
                    `├─ 📄 Files: ${stats.files}\n` +
                    `└─ 🧩 Total: ${total} items\n\n` +
                    `🌳 *Directory Tree:*\nplugins/\n` +
                    buildTree(baseDir);

    await sock.sendMessage(m.key.remoteJid, { text: treeMsg }, { quoted: m });
};

managePluginHandler.help = ["manage"];
managePluginHandler.tags = ["main"];
managePluginHandler.command = /^manage$/i;

export default managePluginHandler;