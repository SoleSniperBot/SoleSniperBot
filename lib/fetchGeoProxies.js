const axios = require('axios');

const GEONODE_USER = process.env.GEONODE_USER;
const GEONODE_PASS = process.env.GEONODE_PASS;

module.exports = async function fetchGeoProxies(limit = 50) {
  try {
    const res = await axios.get(`https://proxylist.geonode.com/api/proxy-list`, {
      params: {
        limit,
        page: 1,
        sort_by: 'lastChecked',
        sort_type: 'desc',
        filterLastChecked: true,
        protocols: 'socks5',
        country: 'gb',
        anonymityLevel: 'elite'
      }
    });

    const proxies = res.data.data.map((proxy, i) => ({
      host: proxy.ip,
      port: proxy.port,
      username: GEONODE_USER,
      password: GEONODE_PASS
    }));

    console.log(`✅ [GeoProxy] Loaded ${proxies.length} fresh SOCKS5`);
    return proxies;
  } catch (err) {
    console.error('❌ Failed to fetch GeoNode proxies:', err.message);
    return [];
  }
};
