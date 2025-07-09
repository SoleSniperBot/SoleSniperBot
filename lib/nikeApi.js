require('dotenv').config();
const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');

const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;
const ip = 'proxy.geonode.io';
const port = process.env.GEONODE_PORT || '9000';

const proxyUrl = `http://${username}:${password}@${ip}:${port}`;

const httpsAgent = new HttpsProxyAgent({
  proxy: proxyUrl,
  keepAlive: true,
});

const headers = {
  'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
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
