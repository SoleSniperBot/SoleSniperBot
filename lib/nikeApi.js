const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');

// Replace with your actual proxy
const proxyUrl = 'http://geonode_fUy6U0SwyY-type-residential:2e3344b4-40ed-4ab8-9299-fdda9d2188a4@proxy.geonode.io:9000';

const httpsAgent = new HttpsProxyAgent({
  proxy: proxyUrl,
  keepAlive: true,
});

const headers = {
  'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)', // mimic SNKRS mobile
  'content-type': 'application/json',
  'accept': 'application/json',
};

async function createNikeAccount(email, password) {
  try {
    const response = await axios.post(
      'https://api.nike.com/identity/user/create',
      {
        email,
        password,
        firstName: 'Mark',
        lastName: 'Phillips',
        country: 'GB',
        locale: 'en_GB',
        receiveEmail: true,
      },
      {
        headers,
        httpsAgent,
        timeout: 10000,
      }
    );

    console.log('✅ Account created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Nike account creation failed:', error.message || error);
    if (error.response) {
      console.error('Nike API response:', error.response.data);
    }
    return null;
  }
}

module.exports = { createNikeAccount };
