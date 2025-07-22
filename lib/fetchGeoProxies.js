const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fetchGeoProxies(amount = 50) {
  const proxies = [];
  const ports = [10000, 10001, 10002];

  for (let i = 0; i < amount; i++) {
    const port = ports[i % ports.length];
    const proxyObj = {
      host: 'proxy.geonode.io',
      port,
      username: process.env.GEONODE_USER,
      password: process.env.GEONODE_PASS,
      formatted: `http://${process.env.GEONODE_USER}:${process.env.GEONODE_PASS}@proxy.geonode.io:${port}`
    };
    proxies.push(proxyObj);
  }

  const filePath = path.join(__dirname, '../data/proxies.json');
  fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));
  console.log(`✅ Saved ${proxies.length} proxies to proxies.json with ports ${ports.join(', ')}`);
  return proxies;
}

module.exports = fetchGeoProxies;
