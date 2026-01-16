import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');
const analyticsFile = path.join(dataDir, 'analytics.json');

// Pastikan folder data ada
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Struktur data analytics
const defaultData = {
    plugins: {},
    global: {
        totalCommands: 0,
        totalSuccess: 0,
        totalFailed: 0,
        totalErrors: 0,
        startDate: new Date().toISOString()
    },
    lastReset: new Date().toISOString()
};

// Load data
function loadAnalytics() {
    try {
        if (!fs.existsSync(analyticsFile)) {
            fs.writeFileSync(analyticsFile, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const data = JSON.parse(fs.readFileSync(analyticsFile, 'utf-8'));
        return data;
    } catch (error) {
        console.error('[ANALYTICS] Error loading data:', error);
        return defaultData;
    }
}

// Save data
function saveAnalytics(data) {
    try {
        fs.writeFileSync(analyticsFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('[ANALYTICS] Error saving data:', error);
    }
}

// Track command execution
export function trackCommand(pluginName, status = 'success', errorMsg = null) {
    const data = loadAnalytics();
    
    // Init plugin data jika belum ada
    if (!data.plugins[pluginName]) {
        data.plugins[pluginName] = {
            name: pluginName,
            totalCalls: 0,
            success: 0,
            failed: 0,
            errors: 0,
            successRate: 0,
            lastUsed: null,
            errorLogs: []
        };
    }
    
    const plugin = data.plugins[pluginName];
    
    // Update counters
    plugin.totalCalls++;
    plugin.lastUsed = new Date().toISOString();
    
    if (status === 'success') {
        plugin.success++;
        data.global.totalSuccess++;
    } else if (status === 'failed') {
        plugin.failed++;
        data.global.totalFailed++;
    } else if (status === 'error') {
        plugin.errors++;
        data.global.totalErrors++;
        
        // Log error (max 10 terakhir)
        if (errorMsg) {
            plugin.errorLogs.unshift({
                message: errorMsg,
                timestamp: new Date().toISOString()
            });
            
            if (plugin.errorLogs.length > 10) {
                plugin.errorLogs = plugin.errorLogs.slice(0, 10);
            }
        }
    }
    
    // Hitung success rate
    plugin.successRate = plugin.totalCalls > 0 
        ? ((plugin.success / plugin.totalCalls) * 100).toFixed(2)
        : 0;
    
    // Update global
    data.global.totalCommands++;
    
    saveAnalytics(data);
}

// Get analytics data
export function getAnalytics() {
    return loadAnalytics();
}

// Get plugin stats
export function getPluginStats(pluginName) {
    const data = loadAnalytics();
    return data.plugins[pluginName] || null;
}

// Get top plugins by success rate
export function getTopPlugins(limit = 10) {
    const data = loadAnalytics();
    const plugins = Object.values(data.plugins);
    
    return plugins
        .filter(p => p.totalCalls >= 5) // Min 5 calls untuk masuk ranking
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, limit);
}

// Get worst plugins by success rate
export function getWorstPlugins(limit = 10) {
    const data = loadAnalytics();
    const plugins = Object.values(data.plugins);
    
    return plugins
        .filter(p => p.totalCalls >= 5)
        .sort((a, b) => a.successRate - b.successRate)
        .slice(0, limit);
}

// Reset analytics
export function resetAnalytics() {
    const newData = {
        ...defaultData,
        lastReset: new Date().toISOString()
    };
    saveAnalytics(newData);
    return newData;
}

// Get global stats
export function getGlobalStats() {
    const data = loadAnalytics();
    const globalSuccessRate = data.global.totalCommands > 0
        ? ((data.global.totalSuccess / data.global.totalCommands) * 100).toFixed(2)
        : 0;
    
    return {
        ...data.global,
        globalSuccessRate,
        totalPlugins: Object.keys(data.plugins).length,
        lastReset: data.lastReset
    };
} 
