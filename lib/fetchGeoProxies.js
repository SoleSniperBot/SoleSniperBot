// lib/fetchGeoProxies.js
require('dotenv').config();

module.exports = async function fetchGeoProxies(count = 50) {
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;
  const host = process.env.GEONODE_HOST || 'proxy.geonode.io';
  const port = process.env.GEONODE_PORT || '9000';

  if (!username || !password) {
    console.error('❌ Missing GEONODE_USER or GEONODE_PASS in .env');
    return [];
  }

  const proxies = [];

  for (let i = 0; i < count; i++) {
    const sessionId = Math.floor(Math.random() * 999999);
    const formatted = `socks5://${username}-session-${sessionId}:${password}@${host}:${port}`;
    proxies.push({
      host,
      port,
      username: `${username}-session-${sessionId}`,
      password,
      formatted
    });
  }

  console.log(`✅ [GeoProxies] Generated ${count} SOCKS5 proxies`);
  return proxies;
};
