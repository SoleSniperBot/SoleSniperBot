require('dotenv').config();

module.exports = async function fetchGeoProxies(count = 50) {
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;
  const host = process.env.GEONODE_HOST || '92.204.164.15'; // ✅ Use real IP
  const port = process.env.GEONODE_PORT || '12000';         // ✅ Match your port

  if (!username || !password) {
    console.error('❌ Missing GEONODE_USER or GEONODE_PASS in .env');
    return [];
  }

  const proxies = [];

  for (let i = 0; i < count; i++) {
    const sessionId = Math.random().toString(36).substring(2, 8); // more unique
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

  console.log(`✅ [GeoProxies] Generated ${count} IP-based SOCKS5 proxies`);
  return proxies;
};
