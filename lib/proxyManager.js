const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/proxies.json');
let lockedProxies = new Set();

function loadProxies() {
  const raw = fs.readFileSync(proxyPath, 'utf8');
  const lines = JSON.parse(raw);
  return lines.map(p => p.trim()).filter(Boolean);
}

async function getLockedProxy() {
  const proxies = loadProxies();
  for (const p of proxies) {
    if (!lockedProxies.has(p)) {
      lockedProxies.add(p);
      const parsed = parseProxy(p);
      if (!parsed) throw new Error('Invalid proxy format');
      return { raw: p, ...parsed };
    }
  }
  throw new Error('No available proxies');
}

function parseProxy(proxyString) {
  const regex = /socks5:\/\/(.*?):(.*?)@(.*?):(\d+)/;
  const match = proxyString.match(regex);
  if (!match) return null;
  return {
    username: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    formatted: proxyString
  };
}

async function releaseLockedProxy(proxy) {
  if (proxy && proxy.raw) {
    lockedProxies.delete(proxy.raw);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
