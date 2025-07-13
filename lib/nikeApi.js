require('dotenv').config();
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { constants } = require('crypto');
const createWithBrowser = require('./browserAccountCreator');

const MAX_RETRIES = 3;

// Secure proxy via env
const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;
const ip = 'proxy.geonode.io';
const port = process.env.GEONODE_PORT || '9000';
const proxyUrl = `http://${username}:${password}@${ip}:${port}`;

// SNKRS-level spoof headers
const headers = {
  'User-Agent': 'Nike/93.0 iPhone11,2 iOS/15.6 scale/3.00',
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
  'x-nike-api-caller-id': 'com.nike.commerce.snkrs.ios',
  'x-nike-ua-id': '93.0',
  'Accept-Language': 'en-GB',
  'x-newrelic-id': 'VQECWF5UChAHUlNTBAcBVg==',
  'Referer': 'https://www.nike.com/gb/launch',
  'Connection': 'keep-alive',
};

// Proxy Agent setup
function getAgent() {
  return new HttpsProxyAgent({
    ...new URL(proxyUrl),
    timeout: 15000,
    keepAlive: true,
    secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
  });
}

// Main creator
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
          proxy: false, // required with httpsAgent
          timeout: 15000,
        }
      );

      console.log('✅ Nike account created:', res.data);
      return res.data;
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Attempt ${attempt} failed:`, err.code || err.message);

      if (err.response?.status === 401) {
        console.error('❌ Unauthorized — Headers likely flagged.');
        return null;
      }

      if (err.response && err.response.status < 500) {
        console.error('❌ Stopped retry due to 4XX:', err.response.data);
        return null;
      }

      await new Promise((res) => setTimeout(res, attempt * 1000));
    }
  }

  console.warn('⚠️ Falling back to browser automation...');
  return await createWithBrowser({ email, password, proxy: proxyUrl });
}

module.exports = { createNikeAccount };
