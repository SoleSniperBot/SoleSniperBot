require('dotenv').config();
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { constants } = require('crypto');
const createWithBrowser = require('./browserAccountCreator');
const { getRandomProxy } = require('./proxyManager');

const MAX_RETRIES = 3;

const headers = {
  'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
  'content-type': 'application/json',
  'accept': 'application/json',
  'accept-language': 'en-GB;q=1.0',
  'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
  'x-newrelic-id': 'VQECWF5UChAHUlNTBAcBVg==',
  'x-nike-api-caller-id': 'com.nike.commerce.snkrs.ios',
  'x-nike-ua-id': '93.0',
};

function getAgent() {
  const proxyUrl = getRandomProxy();

  return new HttpsProxyAgent({
    ...new URL(proxyUrl),
    timeout: 15000,
    keepAlive: true,
    secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
  });
}

async function createNikeAccount(email, password) {
  const payload = {
    email,
    password,
    firstName: 'Mark',
    lastName: 'Phillips',
    country: 'GB',
    locale: 'en_GB',
    receiveEmail: true,
  };

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await axios.post(
        'https://api.nike.com/identity/user/create',
        payload,
        {
          headers,
          httpsAgent: getAgent(),
          proxy: false,
          timeout: 15000,
        }
      );

      console.log('✅ Nike account created:', res.data);
      return res.data;
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Attempt ${attempt} failed:`, err.code || err.message);

      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        console.error('❌ Stopping retries due to 4XX:', err.response.data);
        return null;
      }

      await new Promise((res) => setTimeout(res, attempt * 1000));
    }
  }

  console.warn('⚠️ All API attempts failed, switching to browser fallback...');
  return await createWithBrowser({ email, password, proxy: getRandomProxy() });
}

module.exports = { createNikeAccount };
