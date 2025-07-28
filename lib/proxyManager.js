// lib/proxyManager.js
const fs = require('fs');
const path = require('path');
const fetchGeoProxies = require('./fetchGeoProxies');

const proxyFile = path.join(__dirname, '../data/socks5_proxies.json');
let proxyList = [];
let proxyIndex = 0;

function loadProxies() {
  if (!fs.existsSync(proxyFile)) return [];

  const raw = fs.readFileSync(proxyFile);
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProxies(list) {
  fs.writeFileSync(proxyFile, JSON.stringify(list, null, 2));
}

async function getLockedProxy() {
  proxyList = loadProxies();

  if (!proxyList || proxyList.length === 0) {
    console.log('⚠️ No proxies found. Fetching new proxies...');
    const newProxies = await fetchGeoProxies();
    proxyList = newProxies.map(p => ({ formatted: p }));
    saveProxies(proxyList);
  }

  const proxy = proxyList[proxyIndex % proxyList.length];
  proxyIndex++;
  return proxy;
}

function releaseLockedProxy(proxy) {
  // No-op for now
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
