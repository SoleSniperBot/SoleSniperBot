// lib/fetchGeoProxies.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const proxyPath = path.join(__dirname, '../data/proxies.json');

async function fetchGeoProxies() {
  const apiKey = process.env.GEONODE_API_KEY;
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;

  if (!apiKey || !username || !password) {
    throw new Error('Missing GeoNode API credentials in .env');
  }

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

  const proxies = response.data.data.map(proxy => {
    const port = 9000 + Math.floor(Math.random() * 11); // Optional port shuffle
    return `${proxy.ip}:${port}:${username}:${password}`;
  });

  fs.writeFileSync(proxyPath, JSON.stringify(proxies, null, 2));
  return proxies;
}

module.exports = fetchGeoProxies;
