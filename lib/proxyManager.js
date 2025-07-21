const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
let proxies = [];

if (fs.existsSync(proxiesPath)) {
  proxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf8'));
}

const usedProxies = new Set();

function getLockedProxy() {
  for (const proxy of proxies) {
    if (!usedProxies.has(proxy)) {
      usedProxies.add(proxy);
      return proxy;
    }
  }
  return null;
}

function releaseLockedProxy(proxy) {
  usedProxies.delete(proxy);
}

module.exports = { getLockedProxy, releaseLockedProxy };
