require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function fetchGeoProxies(amount = 50) {
  const GEONODE_USER = 'geonode_fUy6U0SwyY';
  const GEONODE_PASS = 'de9d3498-2b19-429e-922b-8f2a24eeb83c';

  const url = `https://proxylist.geonode.com/api/proxy-list?limit=${amount}&page=1&sort_by=lastChecked&sort_type=desc&filterLastChecked=30&protocols=socks5`;

  const res = await axios.get(url);

  const proxies = res.data.data.map(p => ({
    host: p.ip,
    port: p.port,
    username: GEONODE_USER,
    password: GEONODE_PASS,
    formatted: `http://${GEONODE_USER}:${GEONODE_PASS}@${p.ip}:${p.port}`
  }));

  const filePath = path.join(__dirname, '../data/proxies.json');
  fs.writeFileSync(filePath, JSON.stringify(proxies, null, 2));
  console.log(`✅ Saved ${proxies.length} proxies to proxies.json`);
  return proxies;
}

module.exports = fetchGeoProxies;
