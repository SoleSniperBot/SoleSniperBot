const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const lockedPath = path.join(__dirname, '../data/lockedProxies.json');

// Create files if they don’t exist
if (!fs.existsSync(proxiesPath)) fs.writeFileSync(proxiesPath, JSON.stringify([]));
if (!fs.existsSync(lockedPath)) fs.writeFileSync(lockedPath, JSON.stringify([]));

function getAllProxies() {
  return JSON.parse(fs.readFileSync(proxiesPath));
}

function getLocked() {
  return JSON.parse(fs.readFileSync(lockedPath));
}

function saveLocked(locked) {
  fs.writeFileSync(lockedPath, JSON.stringify(locked, null, 2));
}

function substituteEnvInProxyString(proxyStr) {
  return proxyStr
    .replace('GEONODE_USER', process.env.GEONODE_USER)
    .replace('GEONODE_PASS', process.env.GEONODE_PASS);
}

async function getLockedProxy() {
  const all = getAllProxies();
  const locked = getLocked();

  console.log('🔍 [ProxyManager] Loaded total proxies:', all.length);
  console.log('🔒 [ProxyManager] Currently locked:', locked.length);

  for (const proxy of all) {
    if (!locked.includes(proxy.formatted)) {
      const finalProxy = substituteEnvInProxyString(proxy.formatted);
      console.log('✅ [ProxyManager] Using proxy:', finalProxy);

      locked.push(proxy.formatted);
      saveLocked(locked);

      return {
        ...proxy,
        formatted: finalProxy
      };
    }
  }

  console.warn('❌ [ProxyManager] No available proxies found.');
  return null;
}

async function releaseLockedProxy(proxy) {
  const locked = getLocked();
  const index = locked.indexOf(proxy.formatted);
  if (index !== -1) {
    locked.splice(index, 1);
    saveLocked(locked);
    console.log('🔓 [ProxyManager] Released proxy:', proxy.formatted);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
