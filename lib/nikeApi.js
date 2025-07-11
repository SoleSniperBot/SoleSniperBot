require('dotenv').config();
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { constants } = require('crypto');
const createWithBrowser = require('./browserAccountCreator');

const MAX_RETRIES = 3;

const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;
const ip = 'proxy.geonode.io';
const port = process.env.GEONODE_PORT || '9000';

const proxyUrl = `http://${username}:${password}@${ip}:${port}`;

// Stealth Nike mobile headers
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

// Build proxy agent with TLS legacy flag
function getAgent() {
  return new HttpsProxyAgent({
    ...new URL(proxyUrl),
    timeout: 15000,
    keepAlive: true,
    secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
  });
}

// Core account creation
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
        console.error('❌ Non-retriable error:', err.response.data);
        return null;
      }

      await new Promise((res) => setTimeout(res, attempt * 1000));
    }
  }

  console.warn('⚠️ Fallback triggered: using browser automation...');
  return await createWithBrowser({ email, password, proxy: proxyUrl });
}

module.exports = { createNikeAccount };
