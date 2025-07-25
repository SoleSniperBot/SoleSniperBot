const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/socks5_proxies.json');
let proxyList = [];
let lockedProxies = new Set();

function loadProxies() {
  if (!fs.existsSync(proxiesPath)) {
    console.warn('⚠️ No socks5_proxies.json found.');
    return;
  }

  try {
    const raw = fs.readFileSync(proxiesPath);
    proxyList = JSON.parse(raw);
    console.log(`🔌 Loaded ${proxyList.length} proxies`);
  } catch (e) {
    console.error('❌ Failed to parse socks5_proxies.json:', e.message);
  }
}

// Call once on startup
loadProxies();

function getRandomFreeProxy() {
  const available = proxyList.filter(p => !lockedProxies.has(p));
  if (available.length === 0) return null;

  const selected = available[Math.floor(Math.random() * available.length)];
  lockedProxies.add(selected);
  return selected;
}

async function getLockedProxy() {
  const proxy = getRandomFreeProxy();
  if (!proxy) {
    console.warn('⚠️ No available proxies to lock');
    return null;
  }

  return {
    formatted: proxy,
    release: () => releaseLockedProxy({ formatted: proxy })
  };
}

async function releaseLockedProxy(proxy) {
  if (proxy?.formatted && lockedProxies.has(proxy.formatted)) {
    lockedProxies.delete(proxy.formatted);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
