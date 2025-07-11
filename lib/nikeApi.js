require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { constants } = require('crypto');
const createWithBrowser = require('./browserAccountCreator');

const MAX_RETRIES = 3;
const proxyListPath = path.join(__dirname, '../data/proxies.json');

// Rotate proxies from file
let proxyIndex = 0;
function getNextProxy() {
  const proxies = JSON.parse(fs.readFileSync(proxyListPath));
  const proxy = proxies[proxyIndex % proxies.length];
  proxyIndex++;
  return proxy;
}

function getAgent(proxyUrl) {
  return new HttpsProxyAgent({
    ...new URL(proxyUrl),
    timeout: 15000,
    keepAlive: true,
    secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
  });
}

// Mobile spoofed headers
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
    const proxyUrl = getNextProxy();
    console.log(`🌍 Using proxy #${attempt}: ${proxyUrl}`);

    try {
      const res = await axios.post(
        'https://api.nike.com/identity/user/create',
        payload,
        {
          headers,
          httpsAgent: getAgent(proxyUrl),
          proxy: false, // VERY important to disable default proxying
          timeout: 15000,
        }
      );

      console.log('✅ Nike account created:', res.data);
      return res.data;
    } catch (err) {
      lastError = err;
      const code = err.code || (err.response && err.response.status);

      if (err.response) {
        if (err.response.status >= 400 && err.response.status < 500) {
          console.error('❌ 4XX error – likely bad payload or blocked IP:', err.response.data);
          return null;
        }

        if (err.response.status >= 500) {
          console.warn('⚠️ Nike server error. Will retry with new proxy.');
        }
      } else if (err.code === 'ECONNABORTED') {
        console.warn('⏱️ Request timed out. Retrying...');
      } else {
        console.warn(`⚠️ Proxy/network error: ${code}. Retrying...`);
      }

      await new Promise((res) => setTimeout(res, attempt * 1000));
    }
  }

  console.warn('🛠️ All retries failed. Falling back to Puppeteer...');
  return await createWithBrowser({
    email,
    password,
    proxy: getNextProxy(),
  });
}

module.exports = { createNikeAccount };
