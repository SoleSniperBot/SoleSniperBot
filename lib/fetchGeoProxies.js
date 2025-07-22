// lib/fetchGeoProxies.js
require('dotenv').config();
const fs = require('fs');

module.exports = async function fetchGeoProxies(amount = 50) {
  const host = process.env.GEONODE_HOST || 'proxy.geonode.io';
  const port = process.env.GEONODE_PORT || 9000;
  const username = encodeURIComponent(process.env.GEONODE_USER);
  const password = encodeURIComponent(process.env.GEONODE_PASS);

  const proxies = [];

  for (let i = 0; i < amount; i++) {
    const proxy = {
      host,
      port,
      username,
      password,
      formatted: `http://${username}:${password}@${host}:${port}`
    };
    proxies.push(proxy);
  }

  console.log(`✅ Saved ${amount} proxies to memory with port ${port}`);
  return proxies;
};
