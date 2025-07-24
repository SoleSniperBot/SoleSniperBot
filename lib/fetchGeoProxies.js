require('dotenv').config();

module.exports = async function fetchGeoProxies(count = 50) {
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;
  const host = process.env.GEONODE_HOST || '92.204.164.15'; // ✅ IP, not DNS
  const port = process.env.GEONODE_PORT || '12000';         // ✅ Port

  if (!username || !password) {
    console.error('❌ Missing GEONODE_USER or GEONODE_PASS in .env');
    return [];
  }

  const proxies = [];

  for (let i = 0; i < count; i++) {
    const formatted = `socks5://${username}:${password}@${host}:${port}`;
    proxies.push({
      host,
      port,
      username,
      password,
      formatted
    });
  }

  console.log(`✅ [GeoProxies] Generated ${count} static IP-based SOCKS5 proxies`);
  return proxies;
};
