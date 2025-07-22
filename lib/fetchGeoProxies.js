// lib/fetchGeoProxies.js

const fs = require('fs');
const path = require('path');

async function fetchGeoProxies(amount = 50) {
  const proxies = [];
  const user = process.env.GEONODE_USER;
  const pass = process.env.GEONODE_PASS;
  const host = process.env.GEONODE_HOST || 'proxy.geonode.io';
  const startPort = parseInt(process.env.GEONODE_PORT) || 10000;

  for (let i = 0; i < amount; i++) {
    const port = startPort + i;
    const formatted = `http://${user}:${pass}@${host}:${port}`;

    proxies.push({
      host,
      port,
      username: user,
      password: pass,
      formatted
    });
  }

  const filePath = path.join(__dirname, '../data/proxies.json');
  fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));

  console.log(`✅ Saved ${amount} proxies to proxies.json with ports ${startPort}–${startPort + amount - 1}`);
  return proxies;
}

module.exports = fetchGeoProxies;
