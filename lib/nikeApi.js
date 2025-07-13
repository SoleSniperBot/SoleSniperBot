require('dotenv').config();
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { constants } = require('crypto');
const createWithBrowser = require('./browserAccountCreator');

const MAX_RETRIES = 3;

// Env-based proxy (don't hardcode credentials)
const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;
const ip = 'proxy.geonode.io';
const port = process.env.GEONODE_PORT || '9000';
const proxyUrl = `http://${username}:${password}@${ip}:${port}`;

// Nike Mobile App-Level Headers
const headers = {
  'User-Agent': 'Nike/93.0 (iPhone11,2; iOS 15.6; Scale/3.00)',
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
  'x-nike-api-caller-id': 'com.nike.commerce.snkrs.ios',
  'x-nike-ua-id': '93.0',
  'x-newrelic-id': 'VQECWF5UChAHUlNTBAcBVg==',
  'Accept-Language': 'en-GB',
  'Referer': 'https://www.nike.com/gb/launch',
  'Connection': 'keep-alive',
};

// Proxy Agent
function getAgent() {
  return new HttpsProxyAgent({
    ...new URL(proxyUrl),
    timeout: 10000,
    keepAlive: true,
    secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
  });
}

// Main creation function
async function createNikeAccount(email, password) {
  const payload = {
    email,
    password,
    firstName: 'Chris',
    lastName: 'Johnson',
    country: 'GB',
    locale: 'en_GB',
    receiveEmail: true
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

      if (res.data?.id) {
        console.log('✅ Nike API Account Created:', email);
        return res.data;
      }

      console.warn('⚠️ Unexpected Nike response:', res.data);
    } catch (err) {
      lastError = err;
      const status = err.response?.status;

      if (status === 401) {
        console.error('❌ Blocked: Nike headers flagged (401 Unauthorized).');
        return null;
      }

      if (status && status < 500) {
        console.error(`❌ Retry aborted on 4XX (${status}):`, err.response.data);
        return null;
      }

      console.warn(`⚠️ Attempt ${attempt} failed:`, err.message || err.code);
      await new Promise((res) => setTimeout(res, 1000 * attempt));
    }
  }

  console.warn('⚠️ All retries failed — falling back to browser automation.');
  return await createWithBrowser({ email, password, proxy: proxyUrl });
}

module.exports = { createNikeAccount };
