const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
let proxies = [];

if (fs.existsSync(proxiesPath)) {
  proxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf8'));
}

const used = new Set();

function getLockedProxy() {
  for (const proxy of proxies) {
    const key = `${proxy.host}:${proxy.port}`;
    if (!used.has(key)) {
      used.add(key);
      return proxy;
    }
  }
  console.error('❌ No proxies left or all used.');
  return null;
}

function releaseLockedProxy(proxy) {
  const key = `${proxy.host}:${proxy.port}`;
  used.delete(key);
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
