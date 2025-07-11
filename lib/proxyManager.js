// lib/proxyManager.js
const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/proxies.json');
const locksPath = path.join(__dirname, '../data/proxyLocks.json');

if (!fs.existsSync(locksPath)) {
  fs.writeFileSync(locksPath, JSON.stringify({}));
}

const proxies = JSON.parse(fs.readFileSync(proxyPath));

async function getLockedProxy() {
  const locks = JSON.parse(fs.readFileSync(locksPath));

  for (const proxy of proxies) {
    if (!locks[proxy]) {
      locks[proxy] = true;
      fs.writeFileSync(locksPath, JSON.stringify(locks, null, 2));
      return { formatted: proxy };
    }
  }

  throw new Error('❌ No unused proxies available.');
}

async function releaseLockedProxy(proxy) {
  const locks = JSON.parse(fs.readFileSync(locksPath));
  delete locks[proxy.formatted];
  fs.writeFileSync(locksPath, JSON.stringify(locks, null, 2));
}

module.exports = { getLockedProxy, releaseLockedProxy };
