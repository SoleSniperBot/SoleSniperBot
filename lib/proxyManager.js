// lib/proxyManager.js
const fs = require('fs');
const path = require('path');
const fetchGeoProxies = require('./fetchGeoProxies');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');

let proxies = [];
let locked = {};

async function loadProxies() {
  if (!fs.existsSync(proxyPath)) {
    console.warn('[ProxyManager] socks5_proxies.json not found. Fetching and saving...');
    proxies = await fetchGeoProxies(50);
    fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
  } else {
    proxies = JSON.parse(fs.readFileSync(proxyPath, 'utf8'));
    if (!proxies.length) {
      console.warn('[ProxyManager] Empty proxy list. Re-fetching...');
      proxies = await fetchGeoProxies(50);
      fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
    }
  }

  console.log(`✅ [ProxyManager] Loaded ${proxies.length} proxies`);
}

async function getLockedProxy() {
  if (!proxies.length) await loadProxies();

  for (let proxy of proxies) {
    if (!locked[proxy.formatted]) {
      locked[proxy.formatted] = true;
      return proxy;
    }
  }

  console.error('❌ No available proxies');
  return null;
}

function releaseLockedProxy(proxy) {
  if (proxy && proxy.formatted) {
    locked[proxy.formatted] = false;
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy,
  loadProxies
};
