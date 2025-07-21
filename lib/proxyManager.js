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
    const key = `${proxy.host}:${proxy.port}`;
    if (!usedProxies.has(key) && proxy.username && proxy.password) {
      usedProxies.add(key);
      return {
        ...proxy,
        formatted: `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
      };
    }
  }
  console.error('❌ No proxies left or formatted proxy missing.');
  return null;
}

function releaseLockedProxy(proxy) {
  const key = `${proxy.host}:${proxy.port}`;
  usedProxies.delete(key);
}

module.exports = { getLockedProxy, releaseLockedProxy };
