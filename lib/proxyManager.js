// lib/proxyManager.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const proxyFile = path.join(__dirname, '../data/proxies.json');
let proxies = [];
const lockedProxies = new Map(); // userId => proxyObject

// === Load Proxies from file ===
function loadProxies() {
  if (fs.existsSync(proxyFile)) {
    try {
      proxies = JSON.parse(fs.readFileSync(proxyFile, 'utf8'));
    } catch {
      proxies = [];
    }
  }
}

// === Save to file ===
function saveProxies() {
  fs.writeFileSync(proxyFile, JSON.stringify(proxies, null, 2));
}

// === Fetch from GeoNode ===
async function fetchGeoNodeProxies() {
  try {
    const res = await axios.get(`https://proxylist.geonode.com/api/proxy-list`, {
      params: {
        limit: 25,
        page: 1,
        sort_by: 'lastChecked',
        order: 'desc',
        country: 'GB',
        protocols: 'socks5'
      },
      headers: {
        'Authorization': `Token ${process.env.GEONODE_API_KEY}`
      }
    });

    const geoProxies = res.data.data.map(p => ({
      ip: p.ip,
      port: 9000 + Math.floor(Math.random() * 10), // Shuffle optional
      username: process.env.GEONODE_USER,
      password: process.env.GEONODE_PASS
    }));

    proxies.push(...geoProxies);
    saveProxies();
    return geoProxies;
  } catch (err) {
    console.error('❌ GeoNode fetch failed:', err.message);
    return [];
  }
}

// === Get & Lock Proxy for user ===
async function getLockedProxy(userId) {
  if (lockedProxies.has(userId)) return lockedProxies.get(userId);

  if (proxies.length === 0) loadProxies();
  if (proxies.length === 0) await fetchGeoNodeProxies();
  if (proxies.length === 0) return null;

  const used = [...lockedProxies.values()].map(p => `${p.ip}:${p.port}`);
  const available = proxies.filter(p => !used.includes(`${p.ip}:${p.port}`));

  if (available.length === 0) return null;

  const proxy = available[Math.floor(Math.random() * available.length)];
  lockedProxies.set(userId, proxy);
  return proxy;
}

// === Release Proxy ===
function releaseLockedProxy(userId) {
  lockedProxies.delete(userId);
}

// === Upload custom proxies ===
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
  fetchGeoNodeProxies,
  loadProxies
};
