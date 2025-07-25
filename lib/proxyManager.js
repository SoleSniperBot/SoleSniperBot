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
    console.log(`🔌 Loaded ${proxyList.length} SOCKS5 proxies`);
  } catch (e) {
    console.error('❌ Failed to parse socks5_proxies.json:', e.message);
  }
}

// Call once on startup
loadProxies();

function proxyKey(proxy) {
  return `${proxy.username}@${proxy.host}:${proxy.port}`;
}

function getRandomFreeProxy() {
  const available = proxyList.filter(p => !lockedProxies.has(proxyKey(p)));
  if (available.length === 0) return null;

  const selected = available[Math.floor(Math.random() * available.length)];
  lockedProxies.add(proxyKey(selected));
  return selected;
}

async function getLockedProxy() {
  const proxy = getRandomFreeProxy();
  if (!proxy) {
    console.warn('⚠️ No available proxies to lock');
    return null;
  }

  return {
    host: proxy.host,
    port: proxy.port,
    username: proxy.username,
    password: proxy.password,
    release: () => releaseLockedProxy(proxy)
  };
}

async function releaseLockedProxy(proxy) {
  const key = proxyKey(proxy);
  if (lockedProxies.has(key)) {
    lockedProxies.delete(key);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
