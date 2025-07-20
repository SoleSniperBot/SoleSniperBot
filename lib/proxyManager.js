const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/proxies.json');
let lockedProxies = [];

function loadProxies() {
  if (!fs.existsSync(proxyPath)) return [];
  const raw = fs.readFileSync(proxyPath);
  try {
    const data = JSON.parse(raw);
    return data || [];
  } catch (e) {
    console.error('❌ Failed to parse proxies.json:', e.message);
    return [];
  }
}

function saveLocked(proxy) {
  lockedProxies.push(proxy.formatted);
}

async function getLockedProxy() {
  const allProxies = loadProxies();
  const available = allProxies.find(p => !lockedProxies.includes(p.formatted));
  if (!available) {
    throw new Error('No unlocked proxies available.');
  }
  saveLocked(available);
  return available;
}

function releaseLockedProxy(proxy) {
  lockedProxies = lockedProxies.filter(p => p !== proxy.formatted);
}

function getAllProxies() {
  return loadProxies();
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  getAllProxies,
  saveLocked
};
