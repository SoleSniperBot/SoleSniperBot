// lib/fetchGeoProxies.js

const axios = require('axios');

async function fetchGeoProxies(amount = 25) {
  const url = `https://proxylist.geonode.com/api/proxy-list?limit=${amount}&page=1&sort_by=lastChecked&sort_type=desc&filterLastChecked=30&protocols=socks5`;

  const res = await axios.get(url);
  const proxies = res.data.data.map(p => {
    return {
      ip: p.ip,
      port: p.port,
      username: 'geonode_fUy6U0SwyY',
      password: '2e3344b4-40ed-4ab8-9299-fdda9d2188a4'
    };
  });

  return proxies;
}

module.exports = fetchGeoProxies;
