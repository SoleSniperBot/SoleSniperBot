const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');

// Load proxies at startup
let proxyPool;
try {
  const rawProxies = require(proxiesPath);

  // Normalize to objects if raw strings are used
  proxyPool = rawProxies.map(p => {
    if (typeof p === 'string') {
      return { formatted: p, locked: false };
    }
    return { ...p, locked: false };
  });

  console.log(`✅ [ProxyManager] Loaded ${proxyPool.length} proxies from proxies.json`);
} catch (err) {
  console.error('❌ [ProxyManager] Failed to load proxies:', err.message);
  proxyPool = [];
}

function getLockedProxy() {
  const available = proxyPool.find(p => !p.locked);
  if (!available) {
    console.error('❌ [ProxyManager] No proxies left to assign.');
    return null;
  }

  available.locked = true;
  console.log(`🔐 [ProxyManager] Assigned proxy: ${available.formatted}`);
  return available;
}

function releaseLockedProxy(proxy) {
  const match = proxyPool.find(p => p.formatted === proxy.formatted);
  if (match) {
    match.locked = false;
    console.log(`🔓 [ProxyManager] Released proxy: ${proxy.formatted}`);
  } else {
    console.warn(`⚠️ [ProxyManager] Tried to release unknown proxy: ${proxy.formatted}`);
  }
}

function getProxyCount() {
  return {
    total: proxyPool.length,
    available: proxyPool.filter(p => !p.locked).length,
    used: proxyPool.filter(p => p.locked).length,
  };
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  getProxyCount,
};
