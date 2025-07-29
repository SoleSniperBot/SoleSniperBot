require('dotenv').config();

const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;
const host = 'proxy.geonode.io';
const port = 9000;

function generateGeoProxies(count = 50) {
  const proxies = [];

  for (let i = 0; i < count; i++) {
    const session = Math.random().toString(36).substring(2, 8);
    const proxy = `http://${username}-session-${session}:${password}@${host}:${port}`;
    proxies.push(proxy);
  }

  return proxies;
}

module.exports = async function fetchGeoProxies() {
  console.log('📡 Fetching GeoNode proxies...');
  return generateGeoProxies(50);
};
