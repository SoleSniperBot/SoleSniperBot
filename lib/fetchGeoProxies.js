require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function fetchGeoProxies(amount = 25) {
  const GEONODE_USER = process.env.GEONODE_USER;
  const GEONODE_PASS = process.env.GEONODE_PASS;

  if (!GEONODE_USER || !GEONODE_PASS) {
    throw new Error('❌ Missing GeoNode credentials in .env');
  }

  const url = `https://proxylist.geonode.com/api/proxy-list?limit=${amount}&page=1&sort_by=lastChecked&sort_type=desc&filterLastChecked=30&protocols=socks5`;

  const res = await axios.get(url);

  const proxies = res.data.data.map(p => ({
    host: p.ip,
    port: p.port,
    username: GEONODE_USER,
    password: GEONODE_PASS,
    formatted: `http://${GEONODE_USER}:${GEONODE_PASS}@${p.ip}:${p.port}`
  }));

  // Save to /data/proxies.json
  const filePath = path.join(__dirname, '../data/proxies.json');
  fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));

  console.log(`✅ Saved ${proxies.length} proxies to proxies.json`);
  return proxies;
}

module.exports = fetchGeoProxies;
