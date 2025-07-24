const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');
const locks = {};

// STEP 1: Ensure file exists
if (!fs.existsSync(proxyPath)) {
  console.warn('⚠️ [ProxyManager] socks5_proxies.json not found. Creating blank array.');
  fs.mkdirSync(path.dirname(proxyPath), { recursive: true });
  fs.writeFileSync(proxyPath, JSON.stringify([]));
}

// STEP 2: Parse string like "host:port:username:password" where username may include colons
function parseProxyString(line) {
  const parts = line.split(':');
  if (parts.length < 4) {
    console.warn('❌ [ProxyManager] Invalid proxy line:', line);
    return null;
  }

  const host = parts[0];
  const port = parts[1];
  const password = parts[parts.length - 1];
  const username = parts.slice(2, parts.length - 1).join(':');

  return {
    host,
    port,
    username,
    password,
    formatted: `socks5://${username}:${password}@${host}:${port}`
  };
}

// STEP 3: Load and parse
function loadProxies() {
  try {
    const raw = fs.readFileSync(proxyPath, 'utf8');
    const proxyList = JSON.parse(raw);

    if (!Array.isArray(proxyList)) {
      console.error('❌ [ProxyManager] socks5_proxies.json must be a JSON array of strings');
      return [];
    }

    const parsed = proxyList.map(parseProxyString).filter(Boolean);
    console.log(`🔢 [ProxyManager] Loaded ${parsed.length} proxies`);
    return parsed;
  } catch (err) {
    console.error('❌ [ProxyManager] Failed to read/parse socks5_proxies.json:', err.message);
    return [];
  }
}

// STEP 4: Lock proxy
async function getLockedProxy() {
  const proxies = loadProxies();

  for (const proxy of proxies) {
    const id = `${proxy.host}:${proxy.port}:${proxy.username}`;
    if (!locks[id]) {
      locks[id] = true;
      console.log('🔐 [ProxyManager] Locking proxy:', proxy.formatted);
      return {
        ...proxy,
        id
      };
    }
  }

  throw new Error('No available proxies');
}

// STEP 5: Release
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
