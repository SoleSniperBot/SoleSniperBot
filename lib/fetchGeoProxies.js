// lib/fetchGeoProxies.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const proxyPath = path.join(__dirname, '../data/proxies.json');

async function fetchGeoProxies() {
  const apiKey = process.env.GEONODE_API_KEY;

  if (!apiKey) throw new Error('Missing GEONODE_API_KEY in .env');

  const response = await axios.get('https://proxylist.geonode.com/api/proxy-list', {
    params: {
      limit: 25,
      page: 1,
      sort_by: 'lastChecked',
      sort_type: 'desc',
      country: 'GB',
      protocol: 'socks5'
    },
    headers: {
      'Authorization': `Token ${apiKey}`
    }
  });

  const proxies = response.data.data.map(proxy =>
    `${proxy.ip}:${proxy.port}`
  );

  fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
  return proxies;
}

module.exports = fetchGeoProxies;
