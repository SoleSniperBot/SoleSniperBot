const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
let proxyPool = [];
let lockedProxies = new Set();

// 🔁 Replace placeholders like GEONODE_USER in proxy strings
function substituteEnvInProxyString(str) {
  return str
    .replace(/GEONODE_USER/g, process.env.GEONODE_USER)
    .replace(/GEONODE_PASS/g, process.env.GEONODE_PASS)
    .replace(/GEONODE_HOST/g, process.env.GEONODE_HOST);
}

// 🚀 Load proxies at startup
function loadProxies() {
  if (!fs.existsSync(proxiesPath)) {
    console.error('❌ proxies.json not found.');
    return;
  }

  try {
    const raw = fs.readFileSync(proxiesPath);
    const parsed = JSON.parse(raw);

    proxyPool = parsed.map(p => ({
      ...p,
      formatted: substituteEnvInProxyString(p.formatted)
    }));

    console.log(`📦 [ProxyManager] Loaded total proxies: ${proxyPool.length}`);
  } catch (err) {
    console.error('❌ Failed to load proxies.json:', err.message);
  }
}

// 🔐 Lock and return a free proxy
async function getLockedProxy() {
  for (let proxy of proxyPool) {
    if (!lockedProxies.has(proxy.formatted)) {
      lockedProxies.add(proxy.formatted);
      return proxy;
    }
  }
  throw new Error('No proxies left to assign.');
}

// 🔓 Release locked proxy after use
async function releaseLockedProxy(proxy) {
  if (proxy && proxy.formatted) {
    lockedProxies.delete(proxy.formatted);
  }
}

// 🔄 Manual unlock if needed
function resetLockedProxies() {
  lockedProxies.clear();
  console.log('🔁 All proxies unlocked.');
}

// Load proxies on startup
loadProxies();

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  resetLockedProxies
};
