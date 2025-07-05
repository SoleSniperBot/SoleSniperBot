require('dotenv').config();

/**
 * GeoNode rotating proxy helper
 * This file handles dynamic gateway format for session-based access
 */

async function getGeoNodeProxy() {
  let username = process.env.GEONODE_USER;
  let password = process.env.GEONODE_PASS;

  // Some GeoNode plans include the type inside the username (e.g. geonode_xxx-type-residential)
  if (!username || !password) {
    console.warn('⚠️ Missing GeoNode .env credentials');
    return null;
  }

  // GeoNode rotating session endpoint
  return {
    username,
    password,
    ip: 'proxy.geonode.io',
    port: 9000 // ✅ dynamic sessions use port 9000
  };
}

module.exports = { getGeoNodeProxy };
