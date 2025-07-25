const fs = require('fs');
const path = require('path');

const PROXY_PATH = path.join(__dirname, '../data/socks5_proxies.json');
const LOCK_TIME_MS = 35 * 60 * 1000; // 35 minutes

let proxies = [];
let lockedProxies = {};

function loadProxies() {
  if (!fs.existsSync(PROXY_PATH)) {
    console.warn('⚠️ socks5_proxies.json not found. No proxies loaded.');
    proxies = [];
    return;
  }

  try {
    proxies = JSON.parse(fs.readFileSync(PROXY_PATH));
    console.log(`✅ Loaded ${proxies.length} proxies`);
  } catch (err) {
    console.error('❌ Failed to load proxies:', err.message);
    proxies = [];
  }
}

function getLockedProxy() {
  const now = Date.now();
  for (const proxy of proxies) {
    const lockTime = lockedProxies[proxy];
    if (!lockTime || now - lockTime > LOCK_TIME_MS) {
      lockedProxies[proxy] = now;
      console.log(`🔒 [ProxyManager] Locked proxy for 35 min: ${proxy}`);
      return Promise.resolve({ formatted: proxy });
    }
  }

  return Promise.resolve(null); // No free proxies
}

function releaseLockedProxy(proxyObj) {
  if (proxyObj && proxyObj.formatted) {
    delete lockedProxies[proxyObj.formatted];
    console.log(`🔓 [ProxyManager] Manually released proxy: ${proxyObj.formatted}`);
  }
}

loadProxies();

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
