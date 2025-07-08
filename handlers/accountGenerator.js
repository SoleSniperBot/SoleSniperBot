const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const { getLockedProxy } = require('../lib/proxyManager');

module.exports = async function generateNikeAccount(user) {
  console.log('🌍 [Init] Starting account generation...');

  let proxy;
  try {
    proxy = await getLockedProxy();
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return;
  }

  if (!proxy || !proxy.ip || !proxy.port || !proxy.username || !proxy.password) {
    console.error('❌ Missing proxy field(s): ip, port, username, password');
    return;
  }

  console.log('🧩 Proxy in use:', proxy.formatted);

  const agent = new HttpsProxyAgent(proxy.formatted);

  const email = `solesniper+${Date.now()}@gmail.com`;
  const payload = {
    email,
    password: 'NikeSniper123!',
    firstName: 'Chris',
    lastName: 'Brown',
    birthday: '2001-01-01',
    country: 'GB',
    locale: 'en-GB'
  };

  try {
    const response = await axios.post(
      'https://unofficial-nike-endpoint.com/create', // replace with your real endpoint
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Nike/82 CFNetwork/1406.0.4 Darwin/22.4.0',
        },
        httpsAgent: agent,
        timeout: 15000
      }
    );

    if (!response.data.challengeId) {
      console.error('❌ Nike account creation failed: no challengeId');
      console.log('🪵 Full response:', JSON.stringify(response.data));
      return;
    }

    console.log(`✅ Nike created: ${email}`);
  } catch (err) {
    console.error(`❌ Nike account creation failed:`, err.response?.data || err.message);
  }
};
