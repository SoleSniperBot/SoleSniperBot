// lib/fetchGeoProxies.js
require('dotenv').config();

const username = process.env.GEONODE_USER; // Already includes -type-residential-country-gb-...
const password = process.env.GEONODE_PASS;
const host = 'proxy.geonode.io';
const port = 1080; // GeoNode SOCKS5 port

function generateGeoProxies(count = 50) {
  const proxies = [];

  for (let i = 0; i < count; i++) {
    const session = Math.random().toString(36).substring(2, 8);
    const proxy = `socks5://${username}-session-${session}:${password}@${host}:${port}`;
    proxies.push(proxy);
  }

  return proxies;
}

module.exports = async function fetchGeoProxies() {
  console.log('📡 Fetching GeoNode proxies...');
  return generateGeoProxies(50); // Returns array of formatted SOCKS5 proxies
};
