const fs = require('fs');
const path = require('path');
const fetchGeoProxies = require('../lib/fetchGeoProxies'); // Make sure this exists and is correct

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const lockPath = path.join(__dirname, '../data/proxyLocks.json');

// Ensure both files exist
if (!fs.existsSync(proxiesPath)) fs.writeFileSync(proxiesPath, JSON.stringify([]));
if (!fs.existsSync(lockPath)) fs.writeFileSync(lockPath, JSON.stringify({}));

let proxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf-8'));
let proxyLocks = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));

// 🔐 Assign a locked proxy
async function getLockedProxy(userId = 'default') {
  // Auto-fetch if proxies file is empty
  if (!proxies.length) {
    console.warn('⚠️ proxies.json empty. Fetching fresh proxies...');
    try {
      proxies = await fetchGeoProxies(50);
      fs.writeFileSync(proxiesPath, JSON.stringify(proxies, null, 2));
    } catch (err) {
      console.error('❌ Failed to fetch proxies:', err.message);
      return null;
    }
  }

  for (let i = 0; i < proxies.length; i++) {
    const proxy = proxies[i].formatted;
    const inUse = Object.values(proxyLocks).includes(proxy);
    if (!inUse) {
      proxyLocks[userId] = proxy;
      fs.writeFileSync(lockPath, JSON.stringify(proxyLocks, null, 2));
      console.log('🔁 Assigned proxy to', userId, '->', proxy);
      return { formatted: proxy };
    }
  }

  console.error('❌ No proxies left to assign');
  return null;
}

// 🔓 Release a locked proxy
function releaseLockedProxy(userId = 'default') {
  if (proxyLocks[userId]) {
    console.log('🔓 Released proxy for', userId);
    delete proxyLocks[userId];
    fs.writeFileSync(lockPath, JSON.stringify(proxyLocks, null, 2));
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
