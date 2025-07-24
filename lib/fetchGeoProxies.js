// lib/fetchGeoProxies.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');

module.exports = async function fetchGeoProxies(count = 50) {
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;
  const host = process.env.GEONODE_HOST || '92.204.164.15'; // ✅ Use real IP, not DNS
  const port = process.env.GEONODE_PORT || '12000';         // ✅ Correct GeoNode port

  if (!username || !password) {
    console.error('❌ Missing GEONODE_USER or GEONODE_PASS in .env');
    return [];
  }

  const proxies = [];

  for (let i = 0; i < count; i++) {
    const sessionId = Math.random().toString(36).substring(2, 8);
    const fullUsername = `${username}-type-residential-lifetime-35-session-${sessionId}`;
    const formatted = `socks5://${fullUsername}:${password}@${host}:${port}`;

    proxies.push({
      host,
      port,
      username: fullUsername,
      password,
      formatted
    });
  }

  // Optional: save to JSON file for inspection
  const filePath = path.join(__dirname, '../data/socks5_proxies.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));

  console.log(`✅ [GeoProxies] Generated ${count} IP-based SOCKS5 proxies`);
  return proxies;
};
