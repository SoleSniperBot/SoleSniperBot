const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
let proxies = [];

if (fs.existsSync(proxiesPath)) {
  proxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf8'));
}

const usedProxies = new Set();

/**
 * Returns a proxy object with `host`, `port`, `username`, `password`,
 * and `formatted` string like: http://user:pass@host:port
 */
function getLockedProxy() {
  for (const proxy of proxies) {
    const key = `${proxy.host}:${proxy.port}`;
    if (!usedProxies.has(key)) {
      usedProxies.add(key);
      return {
        ...proxy,
        formatted: `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
      };
    }
  }
  return null;
}

function releaseLockedProxy(proxy) {
  const key = `${proxy.host}:${proxy.port}`;
  usedProxies.delete(key);
}

module.exports = { getLockedProxy, releaseLockedProxy };
