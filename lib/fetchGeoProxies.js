const fs = require('fs');
const path = require('path');

const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');

// === Base Proxy Info ===
const host = '92.204.164.15';
const port = 12000;
const password = 'de9d3498-2b19-429e-922b-8f2a24eeb83c';
const baseUsername = 'geonode_fUy6U0SwyY-type-residential-country-gb-lifetime-45-session';

// === Session IDs (dynamically extend this if needed) ===
const sessionIds = [
  'f2p6H6', 'wplXC8', '6xaRUb', 'pFmhbv', 'UKVX1s',
  'Vc45dd', 'PiMev1', '9ZqLXN', 'My4tN7', 'RZn9xT'
];

// === Generate full SOCKS5 proxy list
function buildProxies() {
  return sessionIds.map((session) => ({
    host,
    port,
    username: `${baseUsername}-${session}`,
    password
  }));
}

// === Save to file
function saveProxies(proxies) {
  fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
  console.log(`✅ Wrote ${proxies.length} proxies to socks5_proxies.json`);
}

// === Load or regenerate
function loadOrGenerateProxies() {
  if (fs.existsSync(proxyPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(proxyPath));
      if (Array.isArray(existing) && existing.length > 0) {
        console.log(`🔌 Loaded ${existing.length} existing SOCKS5 proxies`);
        return existing;
      }
    } catch (e) {
      console.warn('⚠️ Failed to read or parse existing proxy file. Rebuilding...');
    }
  }

  const proxies = buildProxies();
  saveProxies(proxies);
  return proxies;
}

module.exports = {
  loadOrGenerateProxies
};
