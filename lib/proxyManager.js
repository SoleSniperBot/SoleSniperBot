const fs = require('fs');
const path = require('path');
const fetchGeoProxies = require('../lib/fetchGeoProxies');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const lockPath = path.join(__dirname, '../data/proxyLocks.json');

// Ensure files exist
if (!fs.existsSync(proxiesPath)) fs.writeFileSync(proxiesPath, JSON.stringify([]));
if (!fs.existsSync(lockPath)) fs.writeFileSync(lockPath, JSON.stringify({}));

let proxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf-8'));
let proxyLocks = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));

// 🔐 Assign a proxy not in use
async function getLockedProxy(userId = 'default') {
  // If proxy list is empty, fetch new
  if (!proxies.length) {
    console.warn('⚠️ proxies.json empty. Fetching fresh GeoNode proxies...');
    try {
      proxies = await fetchGeoProxies(50);
      fs.writeFileSync(proxiesPath, JSON.stringify(proxies, null, 2));
    } catch (err) {
      console.error('❌ Failed to fetch proxies:', err.message);
      return null;
    }
  }

  for (let i = 0; i < proxies.length; i++) {
    const p = proxies[i];
    const proxyKey = `${p.username}:${p.password}@${p.host}:${p.port}`;

    if (!Object.values(proxyLocks).includes(proxyKey)) {
      proxyLocks[userId] = proxyKey;
      fs.writeFileSync(lockPath, JSON.stringify(proxyLocks, null, 2));

      const proxyFormatted = `http://${proxyKey}`;
      console.log(`🔐 Proxy locked for ${userId}: ${proxyFormatted}`);

      return {
        host: p.host,
        port: p.port,
        username: p.username,
        password: p.password,
        formatted: proxyFormatted
      };
    }
  }

  console.error('❌ No available proxies to assign');
  return null;
}

// 🔓 Release proxy
function releaseLockedProxy(userId = 'default') {
  if (proxyLocks[userId]) {
    console.log(`🔓 Released proxy for ${userId}`);
    delete proxyLocks[userId];
    fs.writeFileSync(lockPath, JSON.stringify(proxyLocks, null, 2));
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
