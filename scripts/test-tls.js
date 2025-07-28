const { tlsClientRequest } = require('../lib/tlsClientRequest');

(async () => {
  try {
    const proxy = 'socks5://your_username:your_password@proxy.geonode.io:12000'; // replace with a working one

    const result = await tlsClientRequest({
      url: 'https://www.nike.com/gb',
      method: 'GET',
      headers: {
        'User-Agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)'
      },
      proxy
    });

    console.log('✅ TLS client returned:', result.status || result);
  } catch (err) {
    console.error('❌ TLS client test failed:', err.message);
  }
})();
