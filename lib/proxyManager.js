const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');
const locks = {};

if (!fs.existsSync(proxyPath)) {
  console.warn('⚠️ [ProxyManager] socks5_proxies.json not found. Creating empty file...');
  fs.mkdirSync(path.dirname(proxyPath), { recursive: true });
  fs.writeFileSync(proxyPath, JSON.stringify([]));
}

function parseLine(proxyStr) {
  const [host, port, username, password] = proxyStr.split(':');
  if (!host || !port || !username || !password) return null;

  return {
    host,
    port,
    username,
    password,
    formatted: `socks5://${username}:${password}@${host}:${port}`
  };
}

function loadProxies() {
  try {
    const raw = fs.readFileSync(proxyPath, 'utf-8');
    const proxyStrings = JSON.parse(raw); // JSON array of strings

    if (!Array.isArray(proxyStrings)) throw new Error('Not an array');

    return proxyStrings.map(parseLine).filter(Boolean);
  } catch (err) {
    console.error('❌ Failed to load or parse socks5_proxies.json:', err.message);
    return [];
  }
}

async function getLockedProxy() {
  const proxies = loadProxies();

  for (const proxy of proxies) {
    const id = `${proxy.host}:${proxy.port}:${proxy.username}`;
    if (!locks[id]) {
      locks[id] = true;
      return {
        ...proxy,
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
