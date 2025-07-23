// lib/fetchGeoProxies.js
require('dotenv').config();
const crypto = require('crypto');
const dns = require('dns').promises;

module.exports = async function fetchGeoProxies(amount = 50) {
  const domain = process.env.GEONODE_HOST || 'proxy.geonode.io';
  const port = process.env.GEONODE_PORT || 10000;
  const baseUsername = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;

  // Resolve domain to IP
  let ip;
  try {
    const res = await dns.lookup(domain);
    ip = res.address;
    console.log(`🌐 Resolved ${domain} → ${ip}`);
  } catch (err) {
    console.error('❌ DNS resolution failed for GeoNode host:', err.message);
    return [];
  }

  const proxies = [];

  for (let i = 0; i < amount; i++) {
    const sessionId = crypto.randomBytes(3).toString('hex');
    const fullUsername = `${baseUsername}-session-${sessionId}`;

    const proxy = {
      host: ip,
      port,
      username: fullUsername,
      password,
      formatted: `http://${fullUsername}:${password}@${ip}:${port}`
    };

    proxies.push(proxy);
  }

  console.log(`✅ Loaded ${amount} GeoNode IP-based proxies with sticky sessions`);
  return proxies;
};
