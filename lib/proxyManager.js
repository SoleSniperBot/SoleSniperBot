const fs = require('fs');
const path = require('path');

const PROXY_PATH = path.join(__dirname, '../data/socks5_proxies.json');
const LOCK_TIME_MS = 35 * 60 * 1000; // 35 minutes

let proxies = [];
let lockedProxies = {};

function loadProxies() {
  if (!fs.existsSync(PROXY_PATH)) {
    console.warn('⚠️ socks5_proxies.json not found. No proxies loaded.');
    return;
  }

  try {
    const raw = JSON.parse(fs.readFileSync(PROXY_PATH));

    if (!Array.isArray(raw)) {
      console.error('❌ Proxy list is not an array.');
      return;
    }

    proxies = raw
      .map(p => (typeof p === 'string' ? { formatted: p } : p))
      .filter(p => p && typeof p.formatted === 'string');

    console.log(`✅ Loaded ${proxies.length} valid proxies`);
  } catch (err) {
    console.error('❌ Failed to parse socks5_proxies.json:', err.message);
  }
}

function getLockedProxy() {
  const now = Date.now();

  if (!proxies.length) {
    console.error('🚫 No proxies loaded to choose from.');
    return Promise.resolve(null);
  }

  for (const proxy of proxies) {
    const key = proxy.formatted;
    const lockTime = lockedProxies[key];

    if (!lockTime || now - lockTime > LOCK_TIME_MS) {
      lockedProxies[key] = now;
      console.log(`🔒 [ProxyManager] Locked proxy: ${key}`);
      return Promise.resolve({ formatted: key });
    }
  }

  console.warn('⏳ All proxies currently locked.');
  return Promise.resolve(null);
}

function releaseLockedProxy(proxyObj) {
  if (proxyObj?.formatted && lockedProxies[proxyObj.formatted]) {
    delete lockedProxies[proxyObj.formatted];
    console.log(`🔓 [ProxyManager] Released proxy: ${proxyObj.formatted}`);
  }
}

loadProxies();

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
