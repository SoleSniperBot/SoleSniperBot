const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
let proxies = [];

if (fs.existsSync(proxiesPath)) {
  proxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf-8'));
}

const lockedProxies = new Set();

function getLockedProxy() {
  for (let proxy of proxies) {
    if (!lockedProxies.has(proxy.formatted)) {
      lockedProxies.add(proxy.formatted);
      return { formatted: proxy.formatted };
    }
  }
  return null;
}

function releaseLockedProxy(proxy) {
  if (proxy && proxy.formatted) {
    lockedProxies.delete(proxy.formatted);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
