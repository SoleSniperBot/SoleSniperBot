const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

// ✅ Replace with your actual GeoNode username and password
const username = 'geonode_fUy6U0SwyY';
const password = 'de9d3498-2b19-429e-922b-8f2a24eeb83c';
const proxyHost = 'proxy.geonode.io';
const proxyPort = 9000; // GeoNode rotating port

const proxyUrl = `socks5://${username}:${password}@${proxyHost}:${proxyPort}`;
const agent = new SocksProxyAgent(proxyUrl);

async function testNikeProxy() {
  try {
    const res = await axios.get('https://www.nike.com/gb', {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 10000,
      headers: {
        'User-Agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
      },
    });

    console.log('✅ SOCKS5 Proxy is working with Nike:', res.status);
  } catch (err) {
    console.error('❌ SOCKS5 Proxy test failed:', err.message);
  }
}

testNikeProxy();
