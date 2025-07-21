require('dotenv').config();
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;
const ip = 'proxy.geonode.io';
const port = process.env.GEONODE_PORT || '9000';

const proxyUrl = `http://${username}:${password}@${ip}:${port}`;
const agent = new HttpsProxyAgent(proxyUrl);

const headers = {
  'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
  'content-type': 'application/json',
  'accept': 'application/json',
};

async function createNikeAccount(email, password, firstName, lastName) {
  try {
    const response = await axios.post(
      'https://api.nike.com/identity/user/create',
      {
        email,
        password,
        firstName,
        lastName,
        country: 'GB',
        locale: 'en_GB',
        receiveEmail: true,
      },
      { headers, httpsAgent: agent }
    );

    return response.data;
  } catch (error) {
    console.error('❌ Nike API account creation error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { createNikeAccount };
