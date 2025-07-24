const fs = require('fs');
const path = require('path');

const locks = {};

function parseProxyString(line) {
  const parts = line.split(':');
  if (parts.length !== 4) {
    console.warn('❌ [ProxyManager] Invalid proxy line:', line);
    return null;
  }

  const [host, port, username, password] = parts;
  return {
    host,
    port,
    username,
    password,
    formatted: `socks5://${username}:${password}@${host}:${port}`
  };
}

function loadProxies(type = 'socks5') {
  const file = path.join(__dirname, `../data/${type}_proxies.json`);

  if (!fs.existsSync(file)) {
    console.warn(`⚠️ [ProxyManager] ${type}_proxies.json not found. Creating blank array.`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify([]));
    return [];
  }

  try {
    const raw = fs.readFileSync(file, 'utf8');
    const proxyList = JSON.parse(raw);
    if (!Array.isArray(proxyList)) {
      console.error('❌ [ProxyManager] Proxy file must be a JSON array of strings');
      return [];
    }
    const parsed = proxyList.map(parseProxyString).filter(Boolean);
    console.log(`🔢 [ProxyManager] Loaded ${parsed.length} proxies`);
    return parsed;
  } catch (err) {
    console.error('❌ [ProxyManager] Failed to load proxies:', err.message);
    return [];
  }
}

async function getLockedProxy(type = 'socks5') {
  const proxies = loadProxies(type);

  for (const proxy of proxies) {
    const id = `${proxy.host}:${proxy.port}:${proxy.username}`;
    if (!locks[id]) {
      locks[id] = true;
      console.log('🔐 [ProxyManager] Locking proxy:', proxy.formatted);
      return { ...proxy, id };
    }
  }

  throw new Error('No available proxies');
}

async function releaseLockedProxy(proxy) {
  if (proxy?.id) {
    console.log('🔓 [ProxyManager] Releasing proxy:', proxy.formatted);
    delete locks[proxy.id];
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
