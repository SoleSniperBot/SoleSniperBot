require('dotenv').config();

async function getGeoNodeProxy() {
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;

  if (!username || !password) {
    console.warn('⚠️ Missing GEONODE_USER or GEONODE_PASS');
    return null;
  }

  return {
    username,
    password,
    ip: 'proxy.geonode.io', // ✅ GeoNode rotating proxy
    port: 9000              // ✅ Correct port for residential sessions
  };
}

module.exports = { getGeoNodeProxy };
