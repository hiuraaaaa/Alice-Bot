import fs from "fs";
import path from "path";
import { getLimitInfo } from "../../lib/limitUtils.js";
import { pathToFileURL } from "url";

const menuHandler = async (m, { sock, text, sender, isPremium }) => {
    const baseDir = path.join(process.cwd(), "plugins");
    const categories = fs.readdirSync(baseDir).filter(d => fs.statSync(path.join(baseDir, d)).isDirectory());

    const userName = m.pushName || sender.split("@")[0];
    
    // ==========================================
    // 🛡️ LOGIKA DETEKSI OWNER & PREMIUM
    // ==========================================
    const senderId = sender.split("@")[0].replace(/\D/g, "");
    const formattedOwners = (global.owner || []).map(o => o.replace(/\D/g, ""));
    const isOwner = formattedOwners.includes(senderId);
    
    const formattedPremium = (global.premium || []).map(p => p.replace(/\D/g, ""));
    const isPremiumUser = isOwner || formattedPremium.includes(senderId) || isPremium;
    // ==========================================

    // 🎯 GET LIMIT INFO
    const limitInfo = getLimitInfo(senderId);
    
    // 🎯 DISPLAY LIMIT BERDASARKAN ROLE
    let limitDisplay = "";
    let roleDisplay = "";
    let roleIcon = "";
    
    if (isOwner) {
        limitDisplay = "♾️ Unlimited";
        roleDisplay = "Owner";
        roleIcon = "👑";
    } else if (isPremiumUser) {
        limitDisplay = "♾️ Unlimited";
        roleDisplay = "Premium";
        roleIcon = "💎";
    } else {
        limitDisplay = `${limitInfo.remaining} / ${limitInfo.max}`;
        roleDisplay = "User";
        roleIcon = "👤";
    }

    // 🎯 UCAPAN BERDASARKAN WAKTU
    const getUcapan = () => {
        const hour = new Date().getHours();
        if (hour < 4) return "Selamat Malam 🌙";
        if (hour < 11) return "Selamat Pagi ☀️";
        if (hour < 15) return "Selamat Siang 🌤️";
        if (hour < 18) return "Selamat Sore 🌅";
        return "Selamat Malam 🌙";
    };

    const ucapan = getUcapan();
    const waLink = `https://wa.me/${global.owner[0].replace(/[^0-9]/g, "")}`;
    const thumbnailUrl = global.bannerUrl || "https://telegra.ph/file/placeholder.jpg";

    let totalFitur = 0;
    for (const dir of categories) {
        const files = fs.readdirSync(path.join(baseDir, dir)).filter(f => f.endsWith(".js"));
        totalFitur += files.length;
    }

    // ===============================
    // Menu utama
    // ===============================
    if (!text) {
        const loadingMsg = await sock.sendMessage(m.key.remoteJid, { 
            text: `_✨ Menyiapkan menu utama..._\n_⏳ Mohon tunggu sebentar..._` 
        }, { quoted: m });

        let menuText = `${ucapan}, *${userName}* 👋

Selamat datang di ${global.botName}

*User Information*
╭ ⌯ Limit: ${limitDisplay}
│ ⌯ Role: ${roleDisplay} ${roleIcon}`;

        if (isPremiumUser && !isOwner) {
            menuText += `
│ ⌯ Benefits: ✨ Active
│   • Unlimited Limit
│   • 50% Cooldown
│   • Premium Commands`;
        }

        menuText += `
╰ ⌯ Status: ${isPremiumUser ? "⭐ Premium Active" : "📊 Regular"}

*Bot Information*
╭ ⌯ Owner: ${global.ownerName}
│ ⌯ Bot: ${global.botName}
│ ⌯ Prefix: ${global.prefix}
│ ⌯ Version: 1.0.0
╰ ⌯ Mode: ${global.isPublic ? "Public 🌍" : "Self 🔒"}

*System Information*
╭ ⌯ Total Kategori: ${categories.length}
│ ⌯ Total Fitur: ${totalFitur}
╰ ⌯ Framework: Baileys - WhiskeySocket

*Menu List*\n`;

        for (const cat of categories) {
            menuText += `      ⌯ ${global.prefix[0]}menu ${cat}\n`;
        }

        menuText += `\n_💡 Ketik ${global.prefix[0]}menu <kategori> untuk melihat detail_`;
        
        if (!isPremiumUser && !isOwner) {
            menuText += `\n\n💎 *Upgrade ke Premium untuk unlimited akses!*`;
            menuText += `\n_Ketik ${global.prefix[0]}cekprem untuk info lebih lanjut_`;
        }

        try {
            return await sock.sendMessage(
                m.key.remoteJid,
                { 
                    text: menuText,
                    contextInfo: {
                        isForwarded: true,
                        mentionedJid: [sender],
                        externalAdReply: {
                            title: global.botName,
                            body: ucapan,
                            thumbnailUrl: thumbnailUrl,
                            sourceUrl: waLink,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                },
                { 
                    quoted: m
                }
            );
        } catch (error) {
            console.error('[MENU] Send message failed:', error);
            // Fallback tanpa interactive features
            return await sock.sendMessage(
                m.key.remoteJid,
                { 
                    image: { url: thumbnailUrl }, 
                    caption: menuText 
                },
                { quoted: m }
            );
        }
    }

    // ===============================
    // Menu kategori
    // ===============================
    const category = text.trim().toLowerCase();
    const targetDir = categories.find(c => c.toLowerCase() === category);

    if (!targetDir) {
        return await sock.sendMessage(
            m.key.remoteJid,
            { text: `❌ Kategori *"${category}"* tidak ditemukan.\n\n_💡 Ketik ${global.prefix[0]}menu untuk melihat daftar kategori_` },
            { quoted: m }
        );
    }

    const loadingMsg = await sock.sendMessage(
        m.key.remoteJid,
        { text: `_📂 Memuat menu kategori *${targetDir}*..._\n_✨ Mengumpulkan daftar fitur..._\n_⏳ Hampir selesai..._` },
        { quoted: m }
    );

    const categoryIcon = {
        'main': '🏠',
        'owner': '👑',
        'group': '👥',
        'download': '📥',
        'ai': '🤖',
        'ai-image': '🎨',
        'fun': '🎮',
        'tools': '🔧',
        'info': 'ℹ️',
        'premium': '💎'
    }[targetDir.toLowerCase()] || '📌';

    let menuText = `${categoryIcon} *Menu ${targetDir.toUpperCase()}*\n\n`;
    menuText += `*User Information*\n`;
    menuText += `╭ ⌯ Limit: ${limitDisplay}\n`;
    menuText += `╰ ⌯ Role: ${roleDisplay} ${roleIcon}\n\n`;
    menuText += `*Daftar Perintah*\n`;

    const files = fs.readdirSync(path.join(baseDir, targetDir)).filter(f => f.endsWith(".js"));
    
    let premiumCommandCount = 0;
    let commandCount = 0;
    
    for (const file of files) {
        try {
            const pluginPath = pathToFileURL(path.join(baseDir, targetDir, file)).href + "?update=" + Date.now();
            const plugin = await import(pluginPath);
            
            const handler = plugin.default;
            const isPremiumCommand = plugin.premium === true;
            
            if (isPremiumCommand) premiumCommandCount++;

            let commands = [];
            
            if (plugin.help && Array.isArray(plugin.help)) {
                for (const helpCmd of plugin.help) {
                    commands.push(`${global.prefix[0]}${helpCmd}`);
                }
            }
            else if (plugin.command) {
                if (typeof plugin.command === 'string') {
                    commands.push(`${global.prefix[0]}${plugin.command}`);
                } else if (Array.isArray(plugin.command)) {
                    for (const cmd of plugin.command) {
                        commands.push(`${global.prefix[0]}${cmd}`);
                    }
                } else if (plugin.command instanceof RegExp) {
                    const regexSource = plugin.command.source;
                    const match = regexSource.match(/\^?\(?([a-z0-9_-]+)/i);
                    if (match) {
                        commands.push(`${global.prefix[0]}${match[1]}`);
                    } else {
                        commands.push(`${global.prefix[0]}${file.replace(".js", "")}`);
                    }
                }
            }
            else if (handler) {
                if (handler.help && Array.isArray(handler.help)) {
                    for (const helpCmd of handler.help) {
                        commands.push(`${global.prefix[0]}${helpCmd}`);
                    }
                } else if (handler.command) {
                    if (typeof handler.command === 'string') {
                        commands.push(`${global.prefix[0]}${handler.command}`);
                    } else if (Array.isArray(handler.command)) {
                        for (const cmd of handler.command) {
                            commands.push(`${global.prefix[0]}${cmd}`);
                        }
                    }
                } else {
                    commands.push(`${global.prefix[0]}${file.replace(".js", "")}`);
                }
            }
            else {
                commands.push(`${global.prefix[0]}${file.replace(".js", "")}`);
            }

            if (commands.length > 0) {
                for (const cmd of commands) {
                    const premiumBadge = isPremiumCommand ? " 💎" : "";
                    const lockedIcon = isPremiumCommand && !isPremiumUser ? " 🔒" : "";
                    menuText += `      ⌯ ${cmd}${premiumBadge}${lockedIcon}\n`;
                    commandCount++;
                }
            }
            
        } catch (err) {
            console.error(`[MENU] Error loading plugin ${file}:`, err);
            menuText += `      ⌯ ${global.prefix[0]}${file.replace(".js", "")} ⚠️\n`;
            commandCount++;
        }
    }

    menuText += `\n_📊 Total: ${files.length} fitur_`;
    
    if (premiumCommandCount > 0) {
        menuText += `\n_💎 Premium Commands: ${premiumCommandCount}_`;
        
        if (!isPremiumUser && !isOwner) {
            menuText += `\n_🔒 ${premiumCommandCount} fitur terkunci - Upgrade ke premium!_`;
        }
    }
    
    menuText += `\n_💡 Ketik ${global.prefix[0]}menu untuk kembali ke menu utama_`;

    try {
        await sock.sendMessage(
            m.key.remoteJid,
            { 
                text: menuText,
                contextInfo: {
                    isForwarded: true,
                    mentionedJid: [sender],
                    externalAdReply: {
                        title: `${categoryIcon} ${targetDir.toUpperCase()}`,
                        body: `${files.length} fitur tersedia`,
                        thumbnailUrl: thumbnailUrl,
                        sourceUrl: waLink,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            },
            { 
                quoted: m
            }
        );
    } catch (error) {
        console.error('[MENU] Send message failed:', error);
        // Fallback
        await sock.sendMessage(
            m.key.remoteJid,
            { 
                image: { url: thumbnailUrl }, 
                caption: menuText 
            },
            { quoted: m }
        );
    }
};

menuHandler.help = ["menu"];
menuHandler.tags = ["main"];
menuHandler.command = /^(menu|help)(?:\s+(\w+))?$/i;

export default menuHandler;