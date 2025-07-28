const fs = require('fs');
const path = require('path');

const proxyFilePath = path.join(__dirname, '../data/socks5_proxies.json');

// === 🔐 GeoNode Base Details ===
const host = 'proxy.geonode.io'; // ✅ Corrected to domain
const port = 12000;
const usernameBase = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;

function generateSessionId(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateProxyString() {
  const sessionId = generateSessionId();
  const fullUsername = `${usernameBase}-${sessionId}`;
  return `socks5://${fullUsername}:${password}@${host}:${port}`;
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
