// lib/proxyManager.js
const fs = require('fs');
const path = require('path');
const fetchGeoProxies = require('./fetchGeoProxies');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');
const locks = {};

if (!fs.existsSync(proxyPath)) {
  console.warn('⚠️ [ProxyManager] socks5_proxies.json not found. Creating empty file...');
  fs.mkdirSync(path.dirname(proxyPath), { recursive: true });
  fs.writeFileSync(proxyPath, JSON.stringify([]));
}

async function loadProxies() {
  let proxies = [];

  try {
    const data = fs.readFileSync(proxyPath, 'utf-8');
    proxies = JSON.parse(data);

    if (!Array.isArray(proxies)) throw new Error('Invalid format');

    if (proxies.length === 0) {
      console.warn('⚠️ [ProxyManager] Empty proxy file. Fetching GeoNode proxies...');
      proxies = await fetchGeoProxies(50); // 🔁 Await actual fetch
    }
  } catch (err) {
    console.error('❌ [ProxyManager] Failed to load proxies:', err.message);
    proxies = [];
  }

  return proxies;
}

function getFormattedProxy(proxy) {
  const { host, port, username, password } = proxy;
  return `socks5://${username}:${password}@${host}:${port}`;
}

async function getLockedProxy() {
  const proxies = await loadProxies();

  for (const proxy of proxies) {
    const id = `${proxy.host}:${proxy.port}`;
    if (!locks[id]) {
      locks[id] = true;
      return {
        ...proxy,
        formatted: getFormattedProxy(proxy),
        id
      };
    }
  }

  throw new Error('No available proxies');
}

async function releaseLockedProxy(proxy) {
  if (proxy?.id) delete locks[proxy.id];
}

module.exports = { getLockedProxy, releaseLockedProxy };
