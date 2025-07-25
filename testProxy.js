const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');

module.exports = async function () {
  const proxy = 'socks5://geonode_fUy6U0SWyY:2e3344b4-40ed-4ab8-9299-fdda9d2188a4@proxy.geonode.io:12000';
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
