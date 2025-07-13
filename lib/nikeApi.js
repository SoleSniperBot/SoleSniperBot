require('dotenv').config();
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { constants } = require('crypto');
const createWithBrowser = require('./browserAccountCreator');

const MAX_RETRIES = 3;

// Proxy config (secure)
const username = process.env.GEONODE_USER;
const password = process.env.GEONODE_PASS;
const ip = 'proxy.geonode.io';
const port = process.env.GEONODE_PORT || '9000';

const proxyUrl = `http://${username}:${password}@${ip}:${port}`;

// SNKRS spoofed headers (TSB-style)
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

// Proxy agent builder
function getAgent() {
  return new HttpsProxyAgent({
    ...new URL(proxyUrl),
    timeout: 15000,
    keepAlive: true,
    secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
  });
}

// Main TSB-level account creator
async function createNikeAccount(email, password, overrideProxy = null) {
  const proxyAgent = overrideProxy
    ? new HttpsProxyAgent({ ...new URL(overrideProxy), timeout: 15000, keepAlive: true })
    : getAgent();

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
      const response = await axios.post(
        'https://api.nike.com/identity/user/create',
        payload,
        {
          headers,
          httpsAgent: proxyAgent,
          proxy: false,
          timeout: 15000,
        }
      );

      if (response.data?.id) {
        console.log(`✅ [NikeAPI] Account created: ${email}`);
        return response.data;
      } else {
        console.warn('❌ [NikeAPI] Unknown response format:', response.data);
      }
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;

      console.warn(`⚠️ Attempt ${attempt} failed (${status}): ${msg}`);

      if (status === 401) {
        console.error('❌ Headers flagged or proxy blocked.');
        return null;
      }

      if (status && status < 500) {
        console.error('❌ Stopping due to 4XX response:', err.response?.data);
        return null;
      }

      await new Promise(res => setTimeout(res, attempt * 1000));
    }
  }

  console.warn('⚠️ All retries failed. Falling back to browser...');
  return await createWithBrowser({ email, password, proxy: overrideProxy || proxyUrl });
}

module.exports = { createNikeAccount };
