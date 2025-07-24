const fs = require('fs');
const path = require('path');
const fetchGeoProxies = require('./fetchGeoProxies');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');

let proxies = [];
let locked = {}; // format: { [proxy.formatted]: { timestamp } }

const LOCK_DURATION_MS = 35 * 60 * 1000; // 35 minutes sticky session lock

async function loadProxies() {
  if (!fs.existsSync(proxyPath)) {
    console.warn('[ProxyManager] socks5_proxies.json not found. Fetching and saving...');
    proxies = await fetchGeoProxies(50);
    fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
  } else {
    proxies = JSON.parse(fs.readFileSync(proxyPath, 'utf8'));
    if (!proxies.length) {
      console.warn('[ProxyManager] Empty proxy list. Re-fetching...');
      proxies = await fetchGeoProxies(50);
      fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
    }
  }

  console.log(`✅ [ProxyManager] Loaded ${proxies.length} proxies`);
}

function isStillLocked(proxy) {
  const lock = locked[proxy.formatted];
  if (!lock) return false;

  const elapsed = Date.now() - lock.timestamp;
  return elapsed < LOCK_DURATION_MS;
}

async function getLockedProxy() {
  if (!proxies.length) await loadProxies();

  for (let proxy of proxies) {
    if (!isStillLocked(proxy)) {
      locked[proxy.formatted] = { timestamp: Date.now() };
      console.log(`🔐 [ProxyManager] Locked proxy for 35 min: ${proxy.formatted}`);
      return proxy;
    }
  }

  console.error('❌ [ProxyManager] No available proxies (all locked)');
  return null;
}

function releaseLockedProxy(proxy) {
  if (proxy && proxy.formatted) {
    delete locked[proxy.formatted];
    console.log(`🔓 [ProxyManager] Manually released proxy: ${proxy.formatted}`);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  loadProxies
};
