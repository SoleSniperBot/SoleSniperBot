const fs = require('fs');
const path = require('path');
const fetchGeoProxies = require('./fetchGeoProxies');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');
const locks = {};

async function ensureProxiesExist() {
  if (!fs.existsSync(proxyPath)) {
    console.warn('[ProxyManager] socks5_proxies.json not found. Fetching and saving...');
    const proxies = await fetchGeoProxies(50);
    fs.mkdirSync(path.dirname(proxyPath), { recursive: true });
    fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
    return proxies;
  }

  const raw = fs.readFileSync(proxyPath, 'utf-8');
  let proxies;

  try {
    proxies = JSON.parse(raw);
    if (!Array.isArray(proxies) || proxies.length === 0) {
      console.warn('[ProxyManager] Proxy file empty. Re-fetching...');
      proxies = await fetchGeoProxies(50);
      fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
    }
  } catch (err) {
    console.error('[ProxyManager] Invalid proxy file. Refetching...', err.message);
    proxies = await fetchGeoProxies(50);
    fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
  }

  return proxies;
}

function getFormattedProxy(proxy) {
  const { host, port, username, password } = proxy;
  return `socks5://${username}:${password}@${host}:${port}`;
}

async function getLockedProxy() {
  const proxies = await ensureProxiesExist();

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
