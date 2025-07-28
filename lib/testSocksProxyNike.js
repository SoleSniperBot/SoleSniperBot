const { SocksProxyAgent } = require('socks-proxy-agent');
const fetch = require('node-fetch');

// ✅ Use a working GeoNode SOCKS5 proxy string
const proxy = 'socks5://geonode_fUy6U0SwyY-type-residential-country-gb-lifetime-45-session-f2p6H6:de9d3498-2b19-429e-922b-8f2a24eeb83c@proxy.geonode.io:12000';

// ✅ Create the SOCKS agent
const agent = new SocksProxyAgent(proxy);

// ✅ Full fetch test
fetch('https://www.nike.com/gb', {
  agent,
  timeout: 15000, // optional timeout to prevent hanging
  headers: {
    'User-Agent': 'Nike/93 (iPhone; iOS 16.4; Scale/3.00)',
  }
})
  .then(res => console.log('✅ Proxy working:', res.status))
  .catch(err => console.error('❌ Proxy failed:', err.message));
