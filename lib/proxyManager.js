const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
const lockPath = path.join(__dirname, '../data/proxyLocks.json');

if (!fs.existsSync(proxiesPath)) {
  fs.writeFileSync(proxiesPath, JSON.stringify([]));
}
if (!fs.existsSync(lockPath)) {
  fs.writeFileSync(lockPath, JSON.stringify({}));
}

const proxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf-8'));
let proxyLocks = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));

function getLockedProxy(userId = 'default') {
  for (let i = 0; i < proxies.length; i++) {
    const proxy = proxies[i].formatted;
    const inUse = Object.values(proxyLocks).includes(proxy);
    if (!inUse) {
      proxyLocks[userId] = proxy;
      fs.writeFileSync(lockPath, JSON.stringify(proxyLocks, null, 2));
      console.log('🔁 Assigned proxy to', userId, '->', proxy);
      return { formatted: proxy };
    }
  }
  console.error('❌ No proxies left to assign');
  return null;
}

function releaseLockedProxy(userId = 'default') {
  if (proxyLocks[userId]) {
    console.log('🔓 Released proxy for', userId);
    delete proxyLocks[userId];
    fs.writeFileSync(lockPath, JSON.stringify(proxyLocks, null, 2));
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
