import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';

const CONNECTIONS_FILE = './jadibot/connections.json';
const SESSIONS_DIR = './jadibot';

// Ensure directories exist
if (!existsSync(SESSIONS_DIR)) {
    mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Load connections
export function loadConnections() {
    try {
        if (!existsSync(CONNECTIONS_FILE)) {
            writeFileSync(CONNECTIONS_FILE, JSON.stringify({}, null, 2));
            return {};
        }
        return JSON.parse(readFileSync(CONNECTIONS_FILE, 'utf-8'));
    } catch (e) {
        console.error('[JADIBOT] Error loading connections:', e);
        return {};
    }
}

// Save connections
export function saveConnections(data) {
    try {
        writeFileSync(CONNECTIONS_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error('[JADIBOT] Error saving connections:', e);
        return false;
    }
}

// Add connection
export function addConnection(userId, sockData) {
    const connections = loadConnections();
    connections[userId] = {
        ...sockData,
        connectedAt: Date.now(),
        lastSeen: Date.now()
    };
    saveConnections(connections);
    return connections[userId];
}

// Remove connection
export function removeConnection(userId) {
    const connections = loadConnections();
    delete connections[userId];
    saveConnections(connections);
}

// Update last seen
export function updateLastSeen(userId) {
    const connections = loadConnections();
    if (connections[userId]) {
        connections[userId].lastSeen = Date.now();
        saveConnections(connections);
    }
}

// Get connection
export function getConnection(userId) {
    const connections = loadConnections();
    return connections[userId] || null;
}

// Get all connections
export function getAllConnections() {
    return loadConnections();
}

// Get session path
export function getSessionPath(userId) {
    return path.join(SESSIONS_DIR, `session-${userId}`);
}

// Delete session folder
export function deleteSession(userId) {
    try {
        const sessionPath = getSessionPath(userId);
        if (existsSync(sessionPath)) {
            rmSync(sessionPath, { recursive: true, force: true });
            console.log(`[JADIBOT] Deleted session: ${userId}`);
            return true;
        }
        return false;
    } catch (e) {
        console.error('[JADIBOT] Error deleting session:', e);
        return false;
    }
}

// Check if user has active connection
export function isConnected(userId) {
    const connections = loadConnections();
    return !!connections[userId];
}

// Get connection count
export function getConnectionCount() {
    const connections = loadConnections();
    return Object.keys(connections).length;
}
