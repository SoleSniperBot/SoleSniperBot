const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/proxies.json');
let proxies = [];
let locked = new Set();

// Load proxies into memory
if (fs.existsSync(proxyPath)) {
  proxies = JSON.parse(fs.readFileSync(proxyPath));
  console.log(`🟢 Loaded ${proxies.length} proxies`);
} else {
  console.log('🔴 No proxies file found');
}

// Get an unlocked proxy
async function getLockedProxy() {
  for (const proxy of proxies) {
    if (!locked.has(proxy.formatted)) {
      locked.add(proxy.formatted);
      return proxy;
    }
  }
  return null;
}

// Release proxy after use
async function releaseLockedProxy(proxy) {
  if (proxy && proxy.formatted) {
    locked.delete(proxy.formatted);
  }
}

// Reset all locks
function unlockAllProxies() {
  locked.clear();
  console.log('🔁 All proxies unlocked');
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  unlockAllProxies
};
