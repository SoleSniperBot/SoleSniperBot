const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/http_proxies.json');
if (!fs.existsSync(proxiesPath)) {
  fs.writeFileSync(proxiesPath, JSON.stringify([]));
}

let lockedProxies = new Set();

function loadProxies() {
  const raw = fs.readFileSync(proxiesPath);
  const list = JSON.parse(raw);
  return list.filter(p => p && !lockedProxies.has(p));
}

function getLockedProxy() {
  const proxies = loadProxies();
  if (!proxies.length) throw new Error('❌ No proxies left');
  const proxy = proxies[Math.floor(Math.random() * proxies.length)];
  lockedProxies.add(proxy);
  return { formatted: proxy };
}

function releaseLockedProxy(proxy) {
  if (proxy && proxy.formatted) lockedProxies.delete(proxy.formatted);
}

module.exports = { getLockedProxy, releaseLockedProxy };
