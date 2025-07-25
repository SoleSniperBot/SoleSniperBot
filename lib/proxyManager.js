const fs = require('fs');
const path = require('path');

const PROXY_PATH = path.join(__dirname, '../data/socks5_proxies.json');
const LOCK_TIME_MS = 35 * 60 * 1000; // 35 minutes

let proxies = [];
let lockedProxies = {};

// ✅ Load proxies from JSON and reset locks
function loadProxies() {
  if (!fs.existsSync(PROXY_PATH)) {
    console.warn('⚠️ socks5_proxies.json not found. No proxies loaded.');
    proxies = [];
    return;
  }

  try {
    proxies = JSON.parse(fs.readFileSync(PROXY_PATH));
    lockedProxies = {}; // 🔄 Reset locks every time the bot starts
    console.log(`✅ Loaded ${proxies.length} proxies`);
    console.log('🔄 Proxy lock pool reset on startup');
  } catch (err) {
    console.error('❌ Failed to load proxies:', err.message);
    proxies = [];
  }
}

// 🔒 Get an available (unlocked or expired) proxy
function getLockedProxy() {
  const now = Date.now();

  for (const proxy of proxies) {
    const lockTime = lockedProxies[proxy.formatted];
    if (!lockTime || now - lockTime > LOCK_TIME_MS) {
      lockedProxies[proxy.formatted] = now;
      console.log(`🔒 [ProxyManager] Locked proxy for 35 min: ${proxy.formatted}`);
      return Promise.resolve({ formatted: proxy.formatted });
    }
  }

  console.error('⛔ All proxies are currently locked.');
  return Promise.resolve(null);
}

// 🔓 Manually release a specific proxy
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
