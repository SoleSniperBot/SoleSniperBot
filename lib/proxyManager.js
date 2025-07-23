// lib/proxyManager.js
const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
let loadedProxies = [];
let locked = new Set();

// Load proxies from file
function loadProxies() {
  if (!fs.existsSync(proxiesPath)) return [];

  try {
    const data = fs.readFileSync(proxiesPath);
    const proxies = JSON.parse(data);

    return proxies.map(proxyStr => {
      const match = proxyStr.match(/^(socks5|http):\/\/(.+?):(.+?)@(.+?):(\d+)$/);
      if (!match) return null;

      const [, type, username, password, host, port] = match;
      return {
        type,
        username,
        password,
        host,
        port: parseInt(port),
        formatted: `${type}://${username}:${password}@${host}:${port}`
      };
    }).filter(Boolean);
  } catch (err) {
    console.error('❌ Failed to load proxies:', err.message);
    return [];
  }
}

// Initialize proxy pool
loadedProxies = loadProxies();

// Get and lock next available proxy
async function getLockedProxy() {
  for (const proxy of loadedProxies) {
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
  if (proxy && proxy.formatted) {
    locked.delete(proxy.formatted);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  reloadProxies: () => {
    loadedProxies = loadProxies();
    locked = new Set();
  }
};
