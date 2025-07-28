// fetchGeoProxies.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const proxyFilePath = path.join(__dirname, '../data/socks5_proxies.json');

// ✅ Load your actual credentials from .env
const host = 'proxy.geonode.io';
const port = 12000;
const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;

function generateProxyString() {
  return `socks5://${username}:${password}@${host}:${port}`;
}

function generateProxies(count = 50) {
  const proxies = [];
  for (let i = 0; i < count; i++) {
    proxies.push(generateProxyString()); // No dynamic session junk
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
