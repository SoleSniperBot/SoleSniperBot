const fs = require('fs');
const path = require('path');

const PROXY_PATH = path.resolve(__dirname, '../data/socks5_proxies.json');
const LOCK_TIME_MS = 35 * 60 * 1000;

let proxies = [];
let lockedProxies = {};

function loadProxies() {
  try {
    if (!fs.existsSync(PROXY_PATH)) {
      console.warn(`⚠️ socks5_proxies.json not found at path: ${PROXY_PATH}`);
      proxies = [];
      return;
    }

    const raw = fs.readFileSync(PROXY_PATH);
    proxies = JSON.parse(raw);

    if (!Array.isArray(proxies)) {
      throw new Error('Proxy file is not an array');
    }

    console.log(`✅ Loaded ${proxies.length} proxies from socks5_proxies.json`);
  } catch (err) {
    console.error('❌ Failed to load proxies:', err.message);
    proxies = [];
  }
}

function getLockedProxy() {
  const now = Date.now();
  for (const proxy of proxies) {
    const proxyStr = proxy.formatted || proxy; // fallback for both string and object formats
    const lockTime = lockedProxies[proxyStr];

    if (!lockTime || now - lockTime > LOCK_TIME_MS) {
      lockedProxies[proxyStr] = now;
      console.log(`🔒 [ProxyManager] Locked proxy: ${proxyStr}`);
      return Promise.resolve({ formatted: proxyStr });
    }
  }

  console.warn('🚫 All proxies are currently locked.');
  return Promise.resolve(null);
}

function releaseLockedProxy(proxyObj) {
  if (proxyObj && proxyObj.formatted) {
    delete lockedProxies[proxyObj.formatted];
    console.log(`🔓 [ProxyManager] Released proxy: ${proxyObj.formatted}`);
  }
}

loadProxies();

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
