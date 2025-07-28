// lib/fetchGeoProxies.js
require('dotenv').config();
const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;
const host = 'proxy.geonode.io';
const port = 10000;

function generateGeoProxies(count = 50) {
  const proxies = [];
  for (let i = 0; i < count; i++) {
    const session = Math.random().toString(36).substring(2, 8);
    proxies.push(`http://${username}-type-residential-country-gb-lifetime-60-session-${session}:${password}@${host}:${port}`);
  }
  return proxies;
}

module.exports = async function fetchGeoProxies() {
  return generateGeoProxies(50);
};
