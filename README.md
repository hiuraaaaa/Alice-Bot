# 🤖 Alice WhatsApp Bot

<div align="center">
  <img src="https://i.ibb.co/placeholder-alice-bot.png" alt="Alice Bot Logo" width="200"/>
  
  [![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
  [![Baileys](https://img.shields.io/badge/Baileys-Latest-blue.svg)](https://github.com/WhiskeySockets/Baileys)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
  [![Status](https://img.shields.io/badge/Status-Active-success.svg)]()
  
  **Modern WhatsApp Bot with Advanced Features** 🚀
  
  [Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Commands](#-commands) • [Contributing](#-contributing)
</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Demo](#-demo)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Commands](#-commands)
- [Premium System](#-premium-system)
- [Plugin System](#-plugin-system)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 About

**Alice** adalah WhatsApp Bot modern yang dibangun dengan Node.js dan Baileys. Bot ini dilengkapi dengan sistem premium, anti-spam, analytics, dan berbagai fitur canggih lainnya.

### ✨ Highlights

- 🔐 **Multi-session Auth** - Pairing code & QR support
- 👑 **Premium System** - Unlimited access untuk premium users
- 🛡️ **Anti-Spam Protection** - Auto-ban system dengan warning
- 📊 **Analytics Dashboard** - Track plugin performance
- 🔄 **Hot Reload** - Auto-reload plugins tanpa restart
- 🎨 **Plugin-based** - Mudah menambah fitur baru
- ⚡ **Fast & Efficient** - Optimized performance

---

## 🚀 Features

### 🎮 Core Features
- ✅ Multi-device support (pairing code)
- ✅ Auto-restart on crash
- ✅ Command cooldown system
- ✅ Daily limit system
- ✅ Group & private chat support
- ✅ Owner-only commands
- ✅ Admin-only commands

### 🤖 AI Features
- 🧠 **GPT-5 Nano** - Advanced AI chat
- 💬 **Gemini AI** - Google's AI assistant
- 🦾 **Grok AI** - Jailbreak AI chat
- 🎨 **Flux Image Gen** - AI image generation
- 🖼️ **Blink Image** - Fast image generation
- 🤖 **Alice AI** - Project-aware coding assistant

### 📥 Downloader Features
- 🎵 **Spotify Downloader** - Download music from Spotify
- 🎶 **YouTube Music** - Download from YouTube
- 🎬 **TikTok Downloader** - Download TikTok videos (no watermark)

### 🛠️ Tools & Utilities
- 🏓 **Ping** - Check bot response time
- 📸 **Remini HD** - Enhance image quality
- 🔗 **ToURL** - Upload image to CDN
- 📊 **Analytics** - Bot statistics & performance
- 🎲 **Random Waifu** - Random anime images

### 👥 Group Management
- 👑 **Set Group Name** - Change group name
- 🔒 **Group Settings** - Manage group settings
- 👮 **Admin Tools** - Admin management

### 🎭 Fun & Random
- 🎲 **Random Commands** - Various random features
- 🎨 **AI Art** - Generate AI artwork

---

## 🎬 Demo

<div align="center">
  <img src="https://i.ibb.co/placeholder-demo-1.png" alt="Demo 1" width="300"/>
  <img src="https://i.ibb.co/placeholder-demo-2.png" alt="Demo 2" width="300"/>
  <img src="https://i.ibb.co/placeholder-demo-3.png" alt="Demo 3" width="300"/>
</div>

---

## 📦 Prerequisites

Sebelum instalasi, pastikan kamu sudah install:

- [Node.js](https://nodejs.org/) v20.x atau lebih tinggi
- [Git](https://git-scm.com/)
- [FFmpeg](https://ffmpeg.org/) (untuk processing media)

---

## 🔧 Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/alice-whatsapp-bot.git
cd alice-whatsapp-bot
2️⃣ Install Dependencies
npm install
3️⃣ Configure Settings
Edit file settings.js:
global.owner = ['628123456789']; // Nomor owner
global.botNumber = '628987654321'; // Nomor bot
global.ownerName = 'Your Name';
global.botName = 'Alice Assistant';
global.prefix = '.';
global.isPublic = true; // true = public, false = self
4️⃣ Run Bot
npm start
5️⃣ Scan Pairing Code
Masukkan nomor bot Anda, lalu scan pairing code yang muncul di terminal menggunakan WhatsApp.
⚙️ Configuration
Basic Settings
// settings.js
global.owner = ['628123456789'];        // Owner number
global.botNumber = '628987654321';      // Bot number
global.prefix = '.';                    // Command prefix
global.isPublic = true;                 // Public/Self mode
Premium Users
global.premium = [
    '628123456789',
    '628987654321'
];
Limit System
global.defaultLimits = {
    user: 20,      // Daily limit untuk user biasa
    premium: 9999  // Unlimited untuk premium
};
Cooldown System
global.cooldownTime = 3000; // Default 3 detik
📖 Usage
Command Format
.command [args]
Example
.ping
.spotify shape of you
.tiktok https://vt.tiktok.com/xxx
.gpt apa itu AI?
💻 Commands
🤖 AI Commands
Command
Description
Limit
Cooldown
.gpt <text>
Chat with GPT-5 Nano
❌
5s
.gemini <text>
Chat with Gemini AI
❌
5s
.grok <text>
Chat with Grok AI
❌
5s
.flux <prompt>
Generate AI image
❌
60s
.blink <prompt>
Fast AI image gen
✅
30s
.alice <question>
Coding assistant
❌
5s
📥 Downloader Commands
Command
Description
Limit
Cooldown
.spotify <query>
Download Spotify music
2
10s
.play <query>
Download from YouTube
2
10s
.tiktok <url>
Download TikTok video
2
10s
🛠️ Tools Commands
Command
Description
Limit
Cooldown
.ping
Check bot speed
❌
-
.remini
Enhance image quality
✅
10s
.tourl
Upload image to CDN
✅
5s
.totalfitur
Show total features
❌
-
👥 Group Commands
Command
Description
Access
.setnamegc <name>
Change group name
Bot Admin
👑 Owner Commands
Command
Description
.addprem <number/@user>
Add premium user
.delprem <number/@user>
Remove premium user
.listprem
Show premium users
.antispam <config>
Configure anti-spam
.analytics [plugin]
Show analytics
.eval <code>
Execute JavaScript
👑 Premium System
Benefits
✅ Unlimited Daily Limit
✅ 50% Cooldown Reduction
✅ No Anti-Spam Check
✅ Access Premium Commands
✅ Priority Support
How to Get Premium?
Contact owner untuk upgrade ke premium!
🔌 Plugin System
Plugin Structure
const aliceHandler = async (m, { sock, reply, text, args }) => {
    // Your plugin code here
    return true; // or false
};

aliceHandler.help = ["command"];
aliceHandler.tags = ["category"];
aliceHandler.command = /^(command|alias)$/i;
aliceHandler.limit = true; // or false
aliceHandler.cooldown = 5000; // in milliseconds
aliceHandler.owner = false;
aliceHandler.group = false;
aliceHandler.admin = false;
aliceHandler.botAdmin = false;
aliceHandler.premium = false;

export default aliceHandler;
Create New Plugin
Create file di plugins/<category>/<name>.js
Ikuti struktur plugin di atas
Bot akan auto-reload plugin baru
Plugin Categories
ai/ - AI & chatbot features
downloader/ - Download features
tools/ - Utility tools
group/ - Group management
owner/ - Owner commands
random/ - Fun & random features
🛡️ Anti-Spam System
Features
⚡ Auto-detect spam
⚠️ Warning system
🚫 Auto-ban on exceed limit
⏰ Configurable ban duration
🔄 Auto-unban support
Configuration
.antispam config maxmsg 10    # Max 10 pesan
.antispam config time 5       # Dalam 5 detik
.antispam config warn 3       # 3x warning = ban
.antispam config ban 30       # Ban 30 menit
📊 Analytics System
Track plugin performance dengan analytics system:
.analytics              # Global stats
.analytics top          # Top 10 plugins
.analytics worst        # Worst 10 plugins
.analytics <plugin>     # Detail plugin
.analytics reset        # Reset data (owner)
🤝 Contributing
Contributions are welcome! Here's how:
Fork the Project
Create your Feature Branch (git checkout -b feature/AmazingFeature)
Commit your Changes (git commit -m 'Add some AmazingFeature')
Push to the Branch (git push origin feature/AmazingFeature)
Open a Pull Request
📝 License
Distributed under the MIT License. See LICENSE for more information.
💬 Support
Need help? Contact us:
📧 Email: your.email@example.com
💬 WhatsApp: +62 812 3456 7890
🌐 Website: yourwebsite.com
🙏 Credits
Baileys - WhatsApp Web API
Node.js - JavaScript Runtime
All contributors who helped this project
⭐ Star History
�
Muat gambar
�

Made with ❤️ by Your Name
Give a ⭐️ if this project helped you!
�
```
