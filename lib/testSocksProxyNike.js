const { SocksProxyAgent } = require('socks-proxy-agent');
const fetch = require('node-fetch');

// Replace with one of your valid proxy strings
const proxy = 'socks5://geonode_fUy6U0SwyY-type-residential-country-gb-lifetime-45-session-f2p6H6:de9d3498-2b19-429e-922b-8f2a24eeb83c@92.204.164.15:12000';

const agent = new SocksProxyAgent(proxy);

fetch('https://www.nike.com/gb', { agent })
  .then(res => console.log('✅ Proxy working:', res.status))
  .catch(err => console.error('❌ Proxy failed:', err.message));
