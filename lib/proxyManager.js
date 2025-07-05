const fs = require('fs');
const path = require('path');
const axios = require('axios');

const proxyFile = path.join(__dirname, '../data/proxies.json');
let proxies = [];
let lockedProxies = new Map(); // userId => proxy string

// === Load Proxies From File ===
function loadProxies() {
  if (fs.existsSync(proxyFile)) {
    proxies = JSON.parse(fs.readFileSync(proxyFile, 'utf8'));
  }
}

// === GeoNode Fallback ===
async function fetchGeoNodeProxies() {
  try {
    const res = await axios.get(`https://proxylist.geonode.com/api/proxy-list?limit=25&page=1&sort_by=lastChecked&order=desc&protocols=socks5&api_key=${process.env.GEONODE_API_KEY}`);
    const geoProxies = res.data.data.map(p => ({
      ip: p.ip,
      port: p.port,
      username: process.env.GEONODE_USERNAME || 'geonode_xxx-type-residential',
      password: process.env.GEONODE_PASSWORD || 'your_password_here'
    }));
    proxies.push(...geoProxies);
    fs.writeFileSync(proxyFile, JSON.stringify(proxies, null, 2));
  } catch (err) {
    console.error('❌ GeoNode proxy fetch failed:', err.message);
  }
}

// === Get a Proxy & Lock it to user ===
async function getLockedProxy(userId) {
  if (lockedProxies.has(userId)) {
    return lockedProxies.get(userId);
  }

  if (proxies.length === 0) {
    loadProxies();
  }

  if (proxies.length === 0) {
    await fetchGeoNodeProxies(); // fallback fetch
  }

  if (proxies.length === 0) return null;

  const available = proxies.filter(p => ![...lockedProxies.values()].includes(p));
  if (available.length === 0) return null;

  const proxy = available[Math.floor(Math.random() * available.length)];
  const proxyString = `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`;

  lockedProxies.set(userId, proxyString);
  return proxyString;
}

// === Release User's Locked Proxy ===
function releaseLockedProxy(userId) {
  lockedProxies.delete(userId);
}

// === Add New Proxies from User Upload ===
function addUserProxies(userId, newProxies) {
  proxies = [...new Set([...proxies, ...newProxies])];
  fs.writeFileSync(proxyFile, JSON.stringify(proxies, null, 2));
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  addUserProxies,
  loadProxies
};
