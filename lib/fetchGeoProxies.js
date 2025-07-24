const fs = require('fs');
const path = require('path');
const fetchGeoProxies = require('./fetchGeoProxies');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');
const locks = {};

// Auto-fetch + save fresh proxies
async function fetchAndSaveProxies(amount = 50) {
  console.warn(`⚠️ [ProxyManager] Fetching ${amount} GeoNode proxies...`);
  const freshProxies = await fetchGeoProxies(amount);
  fs.writeFileSync(proxyPath, JSON.stringify(freshProxies, null, 2));
  return freshProxies;
}

async function loadProxies() {
  let proxies = [];

  try {
    // If file doesn't exist, create and fetch
    if (!fs.existsSync(proxyPath)) {
      console.warn('⚠️ [ProxyManager] socks5_proxies.json not found. Fetching fresh...');
      fs.mkdirSync(path.dirname(proxyPath), { recursive: true });
      return await fetchAndSaveProxies();
    }

    // Try reading file
    const data = fs.readFileSync(proxyPath, 'utf-8');
    proxies = JSON.parse(data);

    if (!Array.isArray(proxies)) {
      throw new Error('Invalid format in socks5_proxies.json');
    }

    if (proxies.length === 0) {
      console.warn('⚠️ [ProxyManager] Proxy file empty. Fetching fresh...');
      proxies = await fetchAndSaveProxies();
    }
  } catch (err) {
    console.error('❌ [ProxyManager] Failed to load proxies:', err.message);
    proxies = await fetchAndSaveProxies(); // Last resort fetch
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

  throw new Error('No available unlocked SOCKS5 proxies');
}

async function releaseLockedProxy(proxy) {
  if (proxy?.id) delete locks[proxy.id];
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
