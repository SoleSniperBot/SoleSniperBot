require('dotenv').config();

async function getGeoNodeProxy() {
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;

  if (!username || !password) {
    console.warn('⚠️ Missing GEONODE_USER or GEONODE_PASS');
    return null;
  }

  // 🔄 Random port between 9000 and 9010
  const port = 9000 + Math.floor(Math.random() * 11);

  return {
    username,
    password,
    ip: 'proxy.geonode.io',
    port
  };
}

module.exports = { getGeoNodeProxy };
