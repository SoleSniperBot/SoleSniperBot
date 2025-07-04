const fetch = require('node-fetch');

const GEONODE_API_KEY = process.env.GEONODE_API_KEY;

async function getGeoNodeProxy() {
  const res = await fetch(`https://proxylist.geonode.com/api/proxy-list?limit=1&page=1&apiKey=${GEONODE_API_KEY}&protocols=http,https,socks5&anonymityLevel=elite&country=GB`);
  const data = await res.json();
  const proxy = data.data[0];
  if (!proxy) throw new Error('❌ No proxy returned from GeoNode');
  return {
    ip: proxy.ip,
    port: proxy.port,
    username: proxy.username || '',
    password: proxy.password || ''
  };
}

module.exports = { getGeoNodeProxy };
