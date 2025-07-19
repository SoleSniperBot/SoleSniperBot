// lib/proxyManager.js
const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const lockedPath = path.join(__dirname, '../data/lockedProxies.json');

// 🔧 Auto-create the proxy and lock files if they don’t exist
if (!fs.existsSync(proxiesPath)) fs.writeFileSync(proxiesPath, JSON.stringify([]));
if (!fs.existsSync(lockedPath)) fs.writeFileSync(lockedPath, JSON.stringify([]));

// 🔄 Load all proxies
function getAllProxies() {
  return JSON.parse(fs.readFileSync(proxiesPath));
}

// 🔒 Load locked proxies
function getLocked() {
  return JSON.parse(fs.readFileSync(lockedPath));
}

// 💾 Save updated locked list
function saveLocked(locked) {
  fs.writeFileSync(lockedPath, JSON.stringify(locked, null, 2));
}

// 🔁 Replace placeholders with env vars in proxy string
function substituteEnvInProxyString(proxyStr) {
  return proxyStr
    .replace('GEONODE_USER', process.env.GEONODE_USER)
    .replace('GEONODE_PASS', process.env.GEONODE_PASS);
}

// 🔐 Grab the next unlocked proxy
async function getLockedProxy() {
  const all = getAllProxies();
  const locked = getLocked();

  for (const proxy of all) {
    if (!proxy.formatted) continue;

    const fullProxyStr = substituteEnvInProxyString(proxy.formatted);
    if (!locked.includes(fullProxyStr)) {
      locked.push(fullProxyStr);
      saveLocked(locked);

      console.log(`🔌 [ProxyManager] Using proxy: ${fullProxyStr}`);
      return { ...proxy, formatted: fullProxyStr };
    }
  }

  console.error('❌ [ProxyManager] No unlocked proxies available.');
  return null;
}

// 🔓 Release locked proxy
async function releaseLockedProxy(proxy) {
  const locked = getLocked();
  const index = locked.indexOf(proxy.formatted);
  if (index !== -1) {
    locked.splice(index, 1);
    saveLocked(locked);
    console.log(`♻️ [ProxyManager] Released proxy: ${proxy.formatted}`);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
