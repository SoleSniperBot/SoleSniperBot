const fs = require('fs');
const path = require('path');

const proxyFilePath = path.join(__dirname, '../data/proxies.json');

let proxyList = [];
try {
  const rawData = fs.readFileSync(proxyFilePath);
  proxyList = JSON.parse(rawData);
} catch (err) {
  console.error('❌ Failed to load proxies.json:', err.message);
}

let usedProxies = new Set();

function getLockedProxy() {
  if (proxyList.length === 0) {
    throw new Error('⚠️ No proxies loaded!');
  }

  let availableProxies = proxyList.filter((_, idx) => !usedProxies.has(idx));
  if (availableProxies.length === 0) {
    throw new Error('⚠️ All proxies are currently locked!');
  }

  const randomIndex = Math.floor(Math.random() * availableProxies.length);
  const proxyIndex = proxyList.findIndex(p => p === availableProxies[randomIndex]);

  usedProxies.add(proxyIndex);
  return {
    ...proxyList[proxyIndex],
    index: proxyIndex
  };
}

function releaseLockedProxy(proxy) {
  if (proxy && typeof proxy.index === 'number') {
    usedProxies.delete(proxy.index);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
