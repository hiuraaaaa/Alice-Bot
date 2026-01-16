/**
 * Professional Logger untuk WhatsApp Bot
 * Full-featured logging dengan ANSI colors, timestamps, dan file logging
 * No external dependencies!
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI Color Codes
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
    
    fg: {
        black: "\x1b[30m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        gray: "\x1b[90m",
        crimson: "\x1b[38m",
        // Extended colors
        brightRed: "\x1b[91m",
        brightGreen: "\x1b[92m",
        brightYellow: "\x1b[93m",
        brightBlue: "\x1b[94m",
        brightMagenta: "\x1b[95m",
        brightCyan: "\x1b[96m",
    },
    bg: {
        black: "\x1b[40m",
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m",
        crimson: "\x1b[48m"
    }
};

// Icons
const icons = {
    info: 'ℹ️',
    success: '✅',
    warn: '⚠️',
    error: '❌',
    debug: '🔧',
    plugin: '🔌',
    command: '⚡',
    premium: '👑',
    user: '👤',
    group: '👥',
    owner: '🔑',
    database: '💾',
    network: '🌐',
    loading: '⏳',
    done: '✨',
    fire: '🔥',
    rocket: '🚀'
};

// Config
const config = {
    enableFileLog: true,
    enableConsoleLog: true,
    logLevel: 'debug', // debug, info, warn, error
    maxFileSize: 10 * 1024 * 1024, // 10MB
    logDir: path.join(process.cwd(), 'logs'),
    dateFormat: 'id-ID',
    timezone: 'Asia/Jakarta'
};

// Ensure log directory exists
if (config.enableFileLog && !fs.existsSync(config.logDir)) {
    fs.mkdirSync(config.logDir, { recursive: true });
}

// Get formatted timestamp
const getTime = () => {
    const now = new Date();
    return now.toLocaleTimeString(config.dateFormat, { 
        hour12: false,
        timeZone: config.timezone
    });
};

const getDate = () => {
    const now = new Date();
    return now.toLocaleDateString(config.dateFormat, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: config.timezone
    });
};

const getFullTimestamp = () => {
    const now = new Date();
    return now.toLocaleString(config.dateFormat, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: config.timezone
    });
};

// Log levels priority
const logLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

// Check if should log based on level
const shouldLog = (level) => {
    return logLevels[level] >= logLevels[config.logLevel];
};

// Write to file
const writeToFile = (message, filename = 'bot.log') => {
    if (!config.enableFileLog) return;
    
    try {
        const logFile = path.join(config.logDir, filename);
        const timestamp = getFullTimestamp();
        const logMessage = `[${timestamp}] ${message}\n`;
        
        // Check file size and rotate if needed
        if (fs.existsSync(logFile)) {
            const stats = fs.statSync(logFile);
            if (stats.size > config.maxFileSize) {
                const backupFile = path.join(config.logDir, `${filename}.${Date.now()}.bak`);
                fs.renameSync(logFile, backupFile);
                
                // Keep only last 5 backup files
                const backupFiles = fs.readdirSync(config.logDir)
                    .filter(f => f.startsWith(filename) && f.endsWith('.bak'))
                    .sort()
                    .reverse();
                
                if (backupFiles.length > 5) {
                    backupFiles.slice(5).forEach(f => {
                        fs.unlinkSync(path.join(config.logDir, f));
                    });
                }
            }
        }
        
        fs.appendFileSync(logFile, logMessage);
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
};

// Strip ANSI colors for file logging
const stripColors = (str) => {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
};

// Core logging function
const log = (level, icon, color, message, data = null) => {
    if (!shouldLog(level)) return;
    
    const time = getTime();
    const levelTag = level.toUpperCase().padEnd(7);
    
    // Console output with colors
    if (config.enableConsoleLog) {
        let output = `${colors.dim}[${time}]${colors.reset} ${color}[${levelTag}]${colors.reset} ${icon} ${message}`;
        
        console.log(output);
        
        // Print additional data if provided
        if (data) {
            if (data instanceof Error) {
                console.error(`${colors.dim}${data.stack}${colors.reset}`);
            } else if (typeof data === 'object') {
                console.log(colors.dim + JSON.stringify(data, null, 2) + colors.reset);
            } else {
                console.log(colors.dim + String(data) + colors.reset);
            }
        }
    }
    
    // File output without colors
    const fileMessage = stripColors(`[${levelTag}] ${message}`);
    writeToFile(fileMessage);
    
    // Write errors to separate file
    if (level === 'error') {
        writeToFile(fileMessage, 'error.log');
        if (data instanceof Error) {
            writeToFile(stripColors(data.stack), 'error.log');
        }
    }
};

// Main logger object
export const logger = {
    // Basic levels
    debug: (msg, data = null) => {
        log('debug', icons.debug, colors.fg.gray, msg, data);
    },
    
    info: (msg, data = null) => {
        log('info', icons.info, colors.fg.cyan, msg, data);
    },
    
    success: (msg, data = null) => {
        log('info', icons.success, colors.fg.green, colors.bright + msg + colors.reset, data);
    },
    
    warn: (msg, data = null) => {
        log('warn', icons.warn, colors.fg.yellow, msg, data);
    },
    
    error: (msg, err = null) => {
        log('error', icons.error, colors.fg.red, colors.bright + msg + colors.reset, err);
    },
    
    // Specialized loggers
    plugin: (folder, file) => {
        const msg = `Loaded: ${colors.fg.yellow}${folder}/${file}${colors.reset}`;
        log('debug', icons.plugin, colors.fg.magenta, msg);
    },
    
    command: (user, command, success = true) => {
        const icon = success ? icons.success : icons.error;
        const color = success ? colors.fg.green : colors.fg.red;
        const status = success ? 'executed' : 'failed';
        const msg = `Command ${colors.bright}${command}${colors.reset} ${status} by ${colors.fg.cyan}${user}${colors.reset}`;
        log('info', icon, color, msg);
    },
    
    premium: (msg, data = null) => {
        log('info', icons.premium, colors.fg.brightYellow, colors.bright + msg + colors.reset, data);
    },
    
    user: (msg, data = null) => {
        log('info', icons.user, colors.fg.blue, msg, data);
    },
    
    group: (msg, data = null) => {
        log('info', icons.group, colors.fg.magenta, msg, data);
    },
    
    owner: (msg, data = null) => {
        log('info', icons.owner, colors.fg.brightMagenta, colors.bright + msg + colors.reset, data);
    },
    
    // ✨ MESSAGE LOGGER WITH CUSTOM STYLE
    message: (msg, from, sender, body, isCmd, commandText) => {
        const time = getTime();
        const chatType = from.endsWith('@g.us') ? `${icons.group} GROUP` : `${icons.user} PRIVATE`;
        const senderName = msg.pushName || sender.split('@')[0];
        const senderId = sender.split('@')[0].replace(/\D/g, '');
        
        console.log(`\n${colors.fg.cyan}╭ ⌯ ${colors.bright}${chatType}${colors.reset} ${colors.dim}- ${time}${colors.reset}`);
        console.log(`${colors.fg.cyan}│ ⌯${colors.reset} From: ${colors.fg.brightCyan}${senderName}${colors.reset}`);
        console.log(`${colors.fg.cyan}│ ⌯${colors.reset} Number: ${colors.dim}${senderId}${colors.reset}`);
        console.log(`${colors.fg.cyan}│ ⌯${colors.reset} Message: ${colors.fg.white}${body}${colors.reset}`);
        if (isCmd) {
            console.log(`${colors.fg.cyan}│ ⌯${colors.reset} Command: ${colors.fg.yellow}${colors.bright}${commandText}${colors.reset}`);
        }
        console.log(`${colors.fg.cyan}╰ ⌯${colors.reset}`);
        
        // Log to file
        const fileMsg = `[MESSAGE] ${chatType} | From: ${senderName} (${senderId}) | ${body}${isCmd ? ` | Command: ${commandText}` : ''}`;
        writeToFile(stripColors(fileMsg), 'messages.log');
    },
    
    database: (msg, data = null) => {
        log('debug', icons.database, colors.fg.brightBlue, msg, data);
    },
    
    network: (msg, data = null) => {
        log('info', icons.network, colors.fg.brightCyan, msg, data);
    },
    
    loading: (msg) => {
        log('info', icons.loading, colors.fg.yellow, msg);
    },
    
    done: (msg) => {
        log('info', icons.done, colors.fg.brightGreen, colors.bright + msg + colors.reset);
    },
    
    // Pairing code box
    pairing: (code) => {
        console.log(`\n${colors.bg.blue}${colors.fg.white}${colors.bright}  PAIRING CODE  ${colors.reset}`);
        console.log(`${colors.fg.blue}${colors.bright}┏━━━━━━━━━━━━━━━━━━━━━━━━┓${colors.reset}`);
        console.log(`${colors.fg.blue}${colors.bright}┃      ${colors.fg.white}${code}${colors.fg.blue}      ┃${colors.reset}`);
        console.log(`${colors.fg.blue}${colors.bright}┗━━━━━━━━━━━━━━━━━━━━━━━━┛${colors.reset}\n`);
        writeToFile(`PAIRING CODE: ${code}`);
    },
    
    // Dividers and boxes
    divider: () => {
        console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
    },
    
    box: (title, content) => {
        const width = 60;
        const titlePadding = Math.floor((width - title.length - 2) / 2);
        
        console.log(`${colors.fg.cyan}┏${'━'.repeat(width)}┓${colors.reset}`);
        console.log(`${colors.fg.cyan}┃${' '.repeat(titlePadding)}${colors.bright}${title}${colors.reset}${colors.fg.cyan}${' '.repeat(width - title.length - titlePadding)}┃${colors.reset}`);
        console.log(`${colors.fg.cyan}┣${'━'.repeat(width)}┫${colors.reset}`);
        
        if (Array.isArray(content)) {
            content.forEach(line => {
                const padding = width - stripColors(line).length;
                console.log(`${colors.fg.cyan}┃${colors.reset} ${line}${' '.repeat(padding > 0 ? padding - 1 : 0)}${colors.fg.cyan}┃${colors.reset}`);
            });
        } else {
            const padding = width - stripColors(content).length;
            console.log(`${colors.fg.cyan}┃${colors.reset} ${content}${' '.repeat(padding > 0 ? padding - 1 : 0)}${colors.fg.cyan}┃${colors.reset}`);
        }
        
        console.log(`${colors.fg.cyan}┗${'━'.repeat(width)}┛${colors.reset}`);
    },
    
    // ASCII Art Banner
    asciiArt: () => {
        const art = `
                          ====+                  :::::                                              
                          -=.           .:..............::-:::                                      
                          +:        .:...........:---:.............                           -     
                          -=     ::...........:-===---....:---:.......                :..:----:     
                          =   .:..  ........:==-:..........:--=:........    . ........:-=----.:     
                          =--..     ......:=-:...............:==:........:..........-==------:      
                          -..       ....:-:....................-=:........::.....:+==-------:.      
                        :..          ..::.......................-=.........::..-::.::-=-----:       
                       ....        ...:.........::...............--.........:-:-.   .+------.       
                     .......    .....:. .......::.................=:.........::      :=----.        
                   :.......... ....::.   ......:.............:.....-..........-.       =--:         
                 .................::.    .....:..............:.....::..........-.    :-=-:.         
                .................::..   ... .::..............-......-...........-    .==-:          
               .......::.....:-..-........  .-...............-.......:..  ......::  ::+:.           
             .........---.:----.-...........+....    ........-.......-.. ........--:=--.            
            .::........---=-:::::..........==....      ......-..  ...::..........::-:::             
          .:-.........--=-=:.:.:......:...=::....      ......-..  ....-...........:..:=             
         .  .........---.:--::-....::=---+==-:.....    .. ..:-........-...........-...:=            
           ...............:-=-:.....=-..=. -.:..............-=........::..........::....            
          ..................--.::..--..-.  -................-=.........:...........-....-           
         ..................:::.-..-.-.::  .-..............:=+=..:......::..........::....           
        ..:...:............::.::.-..-::   .:...............::=---.......:...........-....           
        .:...::............-:.=.-. -:-    .:.............:.=.-..=-......-............-...:          
       .-....:.............=.:+::  --.. ...:............::.- -..=.-:....-...........:::...          
      .::....-............--.--=++%*+##-.::-.:..........:.-. -..+..:....-...........-:::..          
      .=.::.::............=-=+#%%##***###-.-.-..........-.-  ::.=:.:....-...........:.:--.:         
     .+=.-..-.............=*%%#*=::=######--.+..........--.  .::.-.=....-............:..::.         
     . :.-..-..........:.-#%#*-  ==:.+**##-:.=:........::-:.  --.-.=:...-............:......        
       ::-..-..........-.-#**-  ++  .+***#..---........--:::=:=- .:--...-............-....          
       -:=..-.:........+:.=**  .#++=:+***#. :--:.......++#####**: --::..-............::...          
       -.=..:::.......:----.-  :*++++++++#   ---.--...-+=*######%#:-:-.::............::...   :      
       .==-.:-::......-=-=+:.  .*=----=++=    -.:-::..-:=-:+**%%##%=-.--..............-...          
      ..:--::-::......==::+-..  =::::::-*.       :=.-.==   +***%=%#%=..=..............-..-          
      ...:.:.-=-......:+:=-......=-:::-=.         .. :#*=--****#-:%##.::..............-..:          
     ...::...:=+.......+=+........--=-:              .*++==+++**- +#%=-..............::...          
    ..  .-...--=:......*+*............               :+=====+++#. -#%*:..............-....          
    .   .-...=--=......=-*-....:......               .=:::::-=+=  =##+=:.............-.....         
   .    .-...=--+.-....:=-+-...........      ..       --:::::-=  :+==:............:.::...-.         
  .     .--..=-=---=...=-=+*=..........  .-:.         .:=====:  .:.--.............=.-...:+. :       
       .:-=-.-==-=:+=..=*+=::+-......    *.+=---*-+: ............:--.::..........--::...  .:        
 :     .---+--+---==+*:.+::::-++-.       *-+ -- + =:............-=:-+:..........--::....   .        
 -     -----=++=+*##+::---::::+-=+=:     .*- +..=:= ....:.....:-----...........-:--.....   .        
 =    ------++####-  . ::==:::=:::-++=:    :-+:-+:  ......:...:-:--.::......:==-=-.....     .       
 =-  =--=++##*###*     -.=:::::-:::-==+*=-.         ...........=*+=+-.....:-====-......     .       
 :---=*##*#######+     - --::::--::::-=*:-+++=--:::::::::---=++**==-.......:=-=:.......     .       
   --*#**##*#####+     - :*-::::--:::::-=..::--====+#*+++++==+===+-.....:::=---::......             
   --#############.    - +**=::::--:--=:=:.......:=*+====-==+====-....:-=-=---=-:.....              
  --*#############+    -.###-=:::::----==+=-:::-:--::::::::=::-=:...-==++-----=-....:.              
 -==###############:   --#***===:::::--::::--::::::::::-:-=--==:--===++++-----+:....-.              
 --+###############*. .-*##**#*===:::::-=-::::::::::-===--::-=-=======#+-----==....:-.              
 =+-+###############+::+##*#####***=-::::==------::----:::::-----=*:::=#+--=++:...:=-.              
:+=:-##########*****##+*#*#=-#****+--==-:::------::::::::::::=+*##-    =#**++=...:=--.   :          
 =-:-+#####*##########%#**#--#****=.=::=-=-:::::::::::::-====#****  .. :#**#*...-----.=-            
 ::---+#****########%#%####+:#***#: .------:==-----==**#+=--+****= .-  =****#*------ .              
  :----=*##########%#%#####*:****#    .====-=--::--:-#**+**#**###..-  .#######=----  .              
  :--=----=*##      ########-=***+     --=-+==--:. .#***##***###=.:   +#####*##+---  :              
 :--+=-------       ##*#####+-###-     :+====.     +#****++#*###-:  .+#######*##*=                  
  :++=-----==       ##**#####-+##.    .--=++.     :##***=:*#*##*.  -*###########**    .             
   *++-----=+       #*#*#####*:#=.   .=:=-==      *****--*****%*==+##############*    .             
    =+=----=+=       **#######=+:.   =::==:=.    :#**+-+#***##%#***###############    :             
         :--=+=      =**##**#**=::  :-:::::=.   .+#+-=******###%#**##############     -             
                       ****#=##*-::.=::::::=. .:-#==**#######%#%##############***    -+             
                         #**###*#*++:::-:::=....==*#*##***###%%%##*###*#####****#   -=              
                         +#*##+#***+:-+*-::=-::-**#**######*#%:+###********#####*+=--               
                         =*#*=+==*#**#**+::***#*%*****###***     =##*******#.+=++--                 
                          .-+*+   +++*#*#=**#*#*#*****##*           **###+                          
                                        :+==+*==#######=           +====-                           
`;
        console.log(colors.fg.cyan + art + colors.reset);
    },
    
    // Bot status banner
    banner: (botName, botNumber, isPublic, premiumCount) => {
        logger.box('BOT STATUS', [
            `${icons.rocket} Bot Name: ${colors.bright}${botName}${colors.reset}`,
            `${icons.user} Number: ${colors.fg.cyan}${botNumber}${colors.reset}`,
            `${icons.network} Mode: ${isPublic ? colors.fg.green + 'Public 🌍' : colors.fg.yellow + 'Self 🔒'}${colors.reset}`,
            `${icons.premium} Premium Users: ${colors.fg.brightYellow}${premiumCount}${colors.reset}`,
            `${icons.fire} Status: ${colors.fg.green}${colors.bright}ONLINE${colors.reset}`
        ]);
    },
    
    // Stats display
    stats: (data) => {
        logger.box('STATISTICS', Object.entries(data).map(([key, value]) => {
            return `${key}: ${colors.bright}${value}${colors.reset}`;
        }));
    },
    
    // Table display
    table: (headers, rows) => {
        console.table(rows);
    },
    
    // Clear console
    clear: () => {
        console.clear();
    },
    
    // Get config
    getConfig: () => ({ ...config }),
    
    // Update config
    setConfig: (newConfig) => {
        Object.assign(config, newConfig);
    },
    
    // Manual file write
    writeLog: (message, filename = 'custom.log') => {
        writeToFile(message, filename);
    }
};

export default logger; 
