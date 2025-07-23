// lib/proxyManager.js
const fetchGeoProxies = require('./fetchGeoProxies');

let proxies = [];
let locked = new Set();

// Load 50 fresh GeoNode proxies dynamically
async function loadProxies() {
  try {
    proxies = await fetchGeoProxies(50);
    locked = new Set();
    console.log(`✅ Loaded ${proxies.length} GeoNode proxies`);
  } catch (err) {
    console.error('❌ Failed to load proxies:', err.message);
  }
}

// Get and lock next available proxy
async function getLockedProxy() {
  if (proxies.length === 0) await loadProxies();

  for (const proxy of proxies) {
    const key = proxy.formatted;
    if (!locked.has(key)) {
      locked.add(key);
      return proxy;
    }
  }

  throw new Error('No proxies available');
}

// Release locked proxy
async function releaseLockedProxy(proxy) {
  if (proxy?.formatted) {
    locked.delete(proxy.formatted);
  }
}

loadProxies(); // Load at startup

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  reloadProxies: loadProxies
};
