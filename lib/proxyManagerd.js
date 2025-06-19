const lockedProxies = new Set();
const fs = require('fs');
const path = require('path');
const proxyListPath = path.join(__dirname, '../data/proxies.json');

function getLockedProxy() {
  const proxies = JSON.parse(fs.readFileSync(proxyListPath, 'utf8'));
  for (const proxy of proxies) {
    if (!lockedProxies.has(proxy)) {
      lockedProxies.add(proxy);
      return proxy;
    }
  }
  return null; // All proxies in use
}

function releaseLockedProxy(proxy) {
  lockedProxies.delete(proxy);
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
