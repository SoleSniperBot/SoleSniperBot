const fs = require('fs');
const path = require('path');

const proxiesPath = path.join(__dirname, '../data/proxies.json');
let proxies = [];

if (fs.existsSync(proxiesPath)) {
  proxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf8'));
}

const usedProxies = new Set();

function getLockedProxy() {
  for (const proxy of proxies) {
    const key = `${proxy.host}:${proxy.port}`;
    if (!usedProxies.has(key)) {
      usedProxies.add(key);

      // ✅ Build full proxy with env user/pass
      const username = process.env.GEONODE_USER;
      const password = process.env.GEONODE_PASS;

      if (!username || !password) {
        console.error('❌ GEONODE_USER or GEONODE_PASS missing in .env');
        return null;
      }

      return {
        host: proxy.host,
        port: proxy.port,
        username,
        password,
        full: `http://${username}:${password}@${proxy.host}:${proxy.port}`
      };
    }
  }

  console.error('❌ No proxies left or all used.');
  return null;
}

function releaseLockedProxy(proxy) {
  if (!proxy || !proxy.host || !proxy.port) return;
  const key = `${proxy.host}:${proxy.port}`;
  usedProxies.delete(key);
}

module.exports = { getLockedProxy, releaseLockedProxy };
