// fetchGeoProxies.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fetchGeoProxies(amount = 50) {
  const proxies = [];

  for (let i = 0; i < amount; i++) {
    proxies.push({
      host: 'proxy.geonode.io',
      port: 9000,
      username: process.env.GEONODE_USER,
      password: process.env.GEONODE_PASS,
      formatted: `http://${process.env.GEONODE_USER}:${process.env.GEONODE_PASS}@proxy.geonode.io:9000`
    });
  }

  const filePath = path.join(__dirname, '../data/proxies.json');
  fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));
  console.log(`✅ Saved ${proxies.length} proxies to proxies.json`);
  return proxies;
}

module.exports = fetchGeoProxies;
