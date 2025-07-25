require('dotenv').config();
const fs = require('fs');
const path = require('path');

const savePath = path.join(__dirname, '../data/socks5_proxies.json');

module.exports = async function fetchGeoProxies(count = 50) {
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;
  const host = process.env.GEONODE_HOST || '92.204.164.15'; // ✅ IP not domain
  const port = process.env.GEONODE_PORT || '10000';

  if (!username || !password) {
    console.error('❌ Missing GEONODE_USER or GEONODE_PASS in .env');
    return [];
  }

  const proxies = [];

  for (let i = 0; i < count; i++) {
    const sessionId = Math.random().toString(36).substring(2, 8);
    const sessionUser = `${username}-type-residential-country-gb-lifetime-45-session-${sessionId}`;
    const proxyString = `socks5://${sessionUser}:${password}@${host}:${port}`;
    proxies.push(proxyString);
  }

  try {
    fs.writeFileSync(savePath, JSON.stringify(proxies, null, 2));
    console.log(`✅ [GeoProxies] Saved ${proxies.length} proxies to socks5_proxies.json`);
  } catch (err) {
    console.error('❌ Failed to write proxies to file:', err.message);
  }

  return proxies;
};
