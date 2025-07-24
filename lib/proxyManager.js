// lib/proxyManager.js
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

// STEP 2: Load proxies
function loadProxies() {
  try {
    const raw = fs.readFileSync(proxyPath, 'utf8');
    const list = JSON.parse(raw);

    if (!Array.isArray(list)) {
      console.error('❌ [ProxyManager] Proxy file must be a JSON array of strings');
      return [];
    }

    const parsed = list.map((fullUrl) => {
      try {
        const match = fullUrl.match(/^socks5:\/\/(.+?):(.+?)@(.+?):(\d+)$/);
        if (!match) throw new Error(`Invalid proxy format: ${fullUrl}`);

        const [, username, password, host, port] = match;

        return {
          host,
          port,
          username,
          password,
          formatted: fullUrl,
          id: `${host}:${port}:${username}`
        };
      } catch (err) {
        console.warn('❌ [ProxyManager] Skipping malformed proxy:', fullUrl);
        return null;
      }
    }).filter(Boolean);

    console.log(`🔢 [ProxyManager] Loaded ${parsed.length} SOCKS5 proxies`);
    return parsed;
  } catch (err) {
    console.error('❌ [ProxyManager] Failed to read or parse proxy file:', err.message);
    return [];
  }
}

// STEP 3: Get unlocked proxy
async function getLockedProxy(type = 'socks5') {
  const proxies = loadProxies();

  for (const proxy of proxies) {
    if (!locks[proxy.id]) {
      locks[proxy.id] = true;
      console.log('🔐 [ProxyManager] Locked proxy:', proxy.formatted);
      return proxy;
    }
  }

  throw new Error('No available unlocked SOCKS5 proxies');
}

// STEP 4: Release lock
async function releaseLockedProxy(proxy) {
  if (proxy?.id) {
    console.log('🔓 [ProxyManager] Released proxy:', proxy.formatted);
    delete locks[proxy.id];
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
