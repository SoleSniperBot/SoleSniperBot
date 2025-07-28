// ✅ Clean GeoNode SOCKS5 Test (No Suffixes)
const { SocksProxyAgent } = require('socks-proxy-agent');
const fetch = require('node-fetch');
require('dotenv').config();

// ✅ Use .env credentials as-is
const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;
const host = 'proxy.geonode.io';
const port = 12000;

const proxy = `socks5://${username}:${password}@${host}:${port}`;
const agent = new SocksProxyAgent(proxy);

fetch('https://www.nike.com/gb', {
  agent,
  timeout: 15000,
  headers: {
    'User-Agent': 'Nike/93 (iPhone; iOS 16.4; Scale/3.00)',
  }
})
  .then(res => console.log('✅ Proxy working:', res.status))
  .catch(err => console.error('❌ Proxy failed:', err.message));
