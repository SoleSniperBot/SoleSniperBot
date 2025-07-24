// lib/proxyManager.js
const fs = require('fs');
const path = require('path');

const socksPath = path.join(__dirname, '../data/socks5_proxies.json');
let lockedProxies = new Set();

function parseProxyString(proxyStr) {
  const parts = proxyStr.split(':');
  if (parts.length < 4) {
    return null; // Invalid format
  }
  return {
    host: parts[0],
    port: parseInt(parts[1]),
    username: parts[2],
    password: parts[3],
    formatted: `socks5://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`,
    raw: proxyStr
  };
}

function loadProxies() {
  if (!fs.existsSync(socksPath)) {
    console.warn('[ProxyManager] socks5_proxies.json not found. Creating blank array.');
    return [];
  }

  const data = JSON.parse(fs.readFileSync(socksPath));
  return data.map(parseProxyString).filter(Boolean);
}

const allProxies = loadProxies();

async function getLockedProxy() {
  const available = allProxies.find(p => !lockedProxies.has(p.raw));
  if (!available) throw new Error('No available unlocked SOCKS5 proxies');
  lockedProxies.add(available.raw);
  return available;
}

function releaseLockedProxy(proxy) {
  if (proxy?.raw) lockedProxies.delete(proxy.raw);
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
