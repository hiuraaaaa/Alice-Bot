import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

// Konfigurasi
const CONFIG = {
  api: 'https://check-host.net/check-ping',
  resultApi: 'https://check-host.net/check-result',
  maxNodes: 10,
  initialDelay: 15000, // 15 detik
  pollAttempts: 5,
  pollDelay: 5000, // 5 detik
  timeout: 10000
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fetch dengan timeout
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 'Accept': 'application/json', ...options.headers }
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Fungsi utama check ping
async function checkPing(host) {
  if (!host?.trim()) throw new Error('Host tidak valid');

  // 1. Mulai pengecekan
  const initUrl = `${CONFIG.api}?host=${encodeURIComponent(host)}&max_nodes=${CONFIG.maxNodes}`;
  const initRes = await fetchWithTimeout(initUrl);
  
  if (!initRes.ok) throw new Error(`HTTP ${initRes.status}`);
  
  const initData = await initRes.json();
  const requestId = initData.request_id;
  
  if (!requestId) throw new Error('Tidak mendapat request ID');

  // 2. Tunggu hasil
  await delay(CONFIG.initialDelay);

  // 3. Poll hasil
  const resultUrl = `${CONFIG.resultApi}/${requestId}`;
  
  for (let i = 0; i < CONFIG.pollAttempts; i++) {
    const resultRes = await fetchWithTimeout(resultUrl);
    
    if (!resultRes.ok) throw new Error(`HTTP ${resultRes.status}`);
    
    const results = await resultRes.json();
    
    if (Object.values(results).some(v => v !== null)) {
      return {
        host,
        requestId,
        results,
        nodes: initData.nodes,
        permanentLink: initData.permanent_link,
        timestamp: new Date().toISOString()
      };
    }
    
    if (i < CONFIG.pollAttempts - 1) {
      await delay(CONFIG.pollDelay);
    }
  }
  
  throw new Error('Timeout - hasil tidak tersedia setelah 40 detik');
}

// Format hasil untuk WhatsApp
function formatResults(data) {
  let msg = `*🌐 Ping Report: ${data.host}*\n\n`;
  msg += `📄 Laporan lengkap: ${data.permanentLink}\n\n`;
  
  let success = 0, fail = 0;
  
  for (const [nodeId, result] of Object.entries(data.results)) {
    const node = data.nodes[nodeId];
    const location = node ? `${node[1]}, ${node[2]}` : nodeId;
    
    if (!result?.[0]) {
      fail++;
      msg += `⏳ *${location}*\n   Status: No data\n\n`;
      continue;
    }
    
    const pings = result[0];
    const okPings = pings.filter(p => p?.[0] === 'OK');
    
    if (okPings.length === 0) {
      fail++;
      msg += `❌ *${location}*\n   Status: Timeout\n\n`;
      continue;
    }
    
    success++;
    const avgRtt = (okPings.reduce((sum, p) => sum + p[1], 0) / okPings.length * 1000).toFixed(2);
    const ip = okPings[0][2] || 'N/A';
    
    msg += `✅ *${location}*\n`;
    msg += `   IP: ${ip}\n`;
    msg += `   RTT: ${avgRtt}ms (avg)\n`;
    msg += `   Packets: ${okPings.length}/${pings.length}\n\n`;
  }
  
  msg += `*📊 Summary:*\n`;
  msg += `• Total Nodes: ${Object.keys(data.results).length}\n`;
  msg += `• Success: ${success}\n`;
  msg += `• Failed: ${fail}\n\n`;
  msg += `_Data disimpan di server untuk analisis_`;
  
  return msg;
}

// Simpan data mentah (opsional)
async function saveResult(data) {
  try {
    const dir = path.join(process.cwd(), 'data', 'ping_results');
    await fs.mkdir(dir, { recursive: true });
    
    const filename = `ping_${data.host}_${Date.now()}.json`;
    const filepath = path.join(dir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    return filename;
  } catch {
    return null; // Silent fail
  }
}

// Handler utama
const handler = async (m, { text, reply, command }) => {
  if (!text?.trim()) {
    return reply(`❌ *Masukkan host yang ingin dicek!*\n\nContoh:\n\`\`\`.${command} google.com\`\`\`\n\`\`\`.${command} 8.8.8.8\`\`\``);
  }

  const host = text.trim();
  
  // Kirim status awal
  await reply(`⏳ *Memulai ping check ke ${host}...*\nMohon tunggu sekitar 20-30 detik.`);

  try {
    const data = await checkPing(host);
    const message = formatResults(data);
    
    // Kirim hasil
    await reply(message);
    
    // Simpan data di background (tidak perlu tunggu)
    saveResult(data).catch(() => {});
    
  } catch (error) {
    console.error(`[PING ERROR] ${error.message}`);
    await reply(`❌ *Ping check gagal!*\n\n\`\`\`${error.message}\`\`\`\n\nPastikan host valid dan coba lagi.`);
    return false; // Jangan potong limit jika gagal
  }
};

// Metadata
handler.help = ['ping', 'checkping'];
handler.tags = ['tools', 'internet'];
handler.command = /^(ping|checkping)$/i;

// Limit & cooldown
handler.limit = true;
handler.cooldown = 30000; // 30 detik

export default handler;