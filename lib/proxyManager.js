// lib/proxyManager.js
const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');
const locks = {};

// Ensure file exists
if (!fs.existsSync(proxyPath)) {
  console.warn('⚠️ [ProxyManager] socks5_proxies.json not found. Creating blank array.');
  fs.mkdirSync(path.dirname(proxyPath), { recursive: true });
  fs.writeFileSync(proxyPath, JSON.stringify([]));
}

// Load proxies from JSON file
function loadProxies() {
  try {
    const raw = fs.readFileSync(proxyPath, 'utf8');
    const proxyList = JSON.parse(raw);

    if (!Array.isArray(proxyList)) {
      console.error('❌ [ProxyManager] socks5_proxies.json must be an array of strings');
      return [];
    }

    const parsed = proxyList
      .filter((p) => typeof p === 'string' && p.startsWith('socks5://'))
      .map((proxyUrl) => {
        const match = proxyUrl.match(/^socks5:\/\/(.*?):(.*?)@(.*?):(\d+)$/);
        if (!match) {
          console.warn('❌ [ProxyManager] Invalid proxy format:', proxyUrl);
          return null;
        }

        const [_, username, password, host, port] = match;
        return {
          host,
          port,
          username,
          password,
          formatted: proxyUrl,
          id: `${host}:${port}:${username}`
        };
      })
      .filter(Boolean);

    console.log(`🔢 [ProxyManager] Loaded ${parsed.length} SOCKS5 proxies`);
    return parsed;
  } catch (err) {
    console.error('❌ [ProxyManager] Failed to load socks5_proxies.json:', err.message);
    return [];
  }
}

// Return first unlocked proxy
async function getLockedProxy() {
  const proxies = loadProxies();

  for (const proxy of proxies) {
    if (!locks[proxy.id]) {
      locks[proxy.id] = true;
      console.log('🔐 [ProxyManager] Locked:', proxy.formatted);
      return proxy;
    }
  }

  throw new Error('No available proxies');
}

// Release a locked proxy
async function releaseLockedProxy(proxy) {
  if (proxy?.id && locks[proxy.id]) {
    delete locks[proxy.id];
    console.log('🔓 [ProxyManager] Released:', proxy.formatted);
  }
}

module.exports = {
  getLockedProxy,
  releaseLockedProxy
};
