const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

module.exports = async function () {
  const proxy = 'socks5://geonode_fUy6U0SwyY-type-residential-country-gb-lifetime-60-session-T7ryG4:de9d3498-2b19-429e-922b-8f2a24eeb83c@proxy.geonode.io:12000';
  const agent = new SocksProxyAgent(proxy);

  try {
    const res = await axios.get('https://www.nike.com/gb', {
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 10000,
      headers: {
        'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
      },
    });

    console.log('✅ SOCKS5 Proxy is working with Nike:', res.status);
  } catch (err) {
    console.error('❌ SOCKS5 Proxy test failed:', err.message);
  }
};
