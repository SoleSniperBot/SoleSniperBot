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
    ip: 'proxy.geonode.com',
    port: 9001
  };
}

module.exports = { getGeoNodeProxy };
