// lib/proxyManager.js
const fs = require('fs');
const path = require('path');

const proxyFile = path.join(__dirname, '../data/proxies.json');
let proxies = [];
const lockedProxies = new Map(); // userId => proxyObject

// === Load Proxies from file or generate rotating pool ===
function loadProxies() {
  if (fs.existsSync(proxyFile)) {
    try {
      proxies = JSON.parse(fs.readFileSync(proxyFile, 'utf8'));
      return;
    } catch {
      proxies = [];
    }
  }

  // Generate 100 rotating proxies from root GeoNode SOCKS5
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;

  if (!username || !password) {
    console.error('❌ GEONODE_USER or GEONODE_PASS missing in .env');
    return;
  }

  proxies = Array.from({ length: 100 }, () => ({
    ip: 'proxy.geonode.io',
    port: 9000,
    username,
    password
  }));

  saveProxies();
}

// === Save to file ===
function saveProxies() {
  fs.writeFileSync(proxyFile, JSON.stringify(proxies, null, 2));
}

// === Get & Lock Proxy for user ===
async function getLockedProxy(userId) {
  if (lockedProxies.has(userId)) return lockedProxies.get(userId);

  if (proxies.length === 0) loadProxies();
  if (proxies.length === 0) return null;

  const used = [...lockedProxies.values()].map(p => `${p.ip}:${p.port}:${p.username}`);
  const available = proxies.filter(p => !used.includes(`${p.ip}:${p.port}:${p.username}`));

  if (available.length === 0) return null;

  const proxy = available[Math.floor(Math.random() * available.length)];

  if (!proxy || !proxy.ip || !proxy.port || !proxy.username || !proxy.password) {
    console.error('❌ Invalid proxy object:', proxy);
    return null;
  }

  lockedProxies.set(userId, proxy);
  console.log(`🌍 Proxy for ${userId}: ${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`);
  return proxy;
}

// === Release Proxy ===
function releaseLockedProxy(userId) {
  lockedProxies.delete(userId);
}

// === Upload custom proxies (still supported) ===
function addUserProxies(userId, newList) {
  const parsed = newList
    .map(line => {
      const parts = line.trim().split(':');
      if (parts.length === 4) {
        return {
          ip: parts[0],
          port: parseInt(parts[1]),
          username: parts[2],
          password: parts[3]
        };
      }
      return null;
    })
    .filter(Boolean);

  proxies = [...proxies, ...parsed];
  saveProxies();
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  addUserProxies,
  loadProxies,
  saveProxies
};
