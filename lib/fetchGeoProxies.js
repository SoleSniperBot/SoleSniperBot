// fetchGeoProxies.js
const fs = require('fs');
const path = require('path');

const proxyFilePath = path.join(__dirname, '../data/socks5_proxies.json');

// === 🔐 GeoNode Credentials ===
const host = 'proxy.geonode.io';
const port = 12000; // Or your preferred sticky port
const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;

// === Generate SOCKS5 proxies with no session suffix ===
function generateProxyString() {
  return `socks5://${username}:${password}@${host}:${port}`;
}

function generateProxies(count = 50) {
  const proxies = [];
  for (let i = 0; i < count; i++) {
    proxies.push(generateProxyString());
  }
  return proxies;
}

function saveProxiesToFile(proxies) {
  fs.writeFileSync(proxyFilePath, JSON.stringify(proxies, null, 2));
  console.log(`✅ Saved ${proxies.length} SOCKS5 proxies to socks5_proxies.json`);
}

// === Run
const newProxies = generateProxies(50);
saveProxiesToFile(newProxies);
