require('dotenv').config();

async function getGeoNodeProxy() {
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;

  if (!username || !password) {
    console.warn('⚠️ GEONODE_USER or GEONODE_PASS missing from environment. Returning null.');
    return null;
  }

  // Default GeoNode shared proxy (change IP/port if needed)
  return {
    username,
    password,
    ip: 'proxy.geonode.com',
    port: 9001
  };
}

module.exports = { getGeoNodeProxy };
