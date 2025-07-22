// lib/fetchGeoProxies.js
require('dotenv').config();
const crypto = require('crypto');

module.exports = async function fetchGeoProxies(amount = 50) {
  const host = process.env.GEONODE_HOST || 'proxy.geonode.io';
  const port = process.env.GEONODE_PORT || 10000;
  const baseUsername = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;

  const proxies = [];

  for (let i = 0; i < amount; i++) {
    const sessionId = crypto.randomBytes(3).toString('hex'); // sticky session ID
    const fullUsername = `${baseUsername}-session-${sessionId}`;

    const proxy = {
      host,
      port,
      username: fullUsername,
      password,
      formatted: `http://${fullUsername}:${password}@${host}:${port}`
    };

    proxies.push(proxy);
  }

  console.log(`✅ Loaded ${amount} GeoNode proxies with sticky sessions`);
  return proxies;
};
