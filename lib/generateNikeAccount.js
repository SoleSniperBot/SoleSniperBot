require('dotenv').config();
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { createNikeAccountWithBrowserAndLogin } = require('../lib/browserAccountCreator'); // Browser + login
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { generateRandomUser } = require('../lib/nameGen');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log('👟 [NikeGen] Starting generation for:', user);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) throw new Error('Invalid or missing proxy');
  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    return;
  }

  const agent = new HttpsProxyAgent(proxy.formatted);

  let email;
  try {
    email = await getNextEmail();
  } catch (err) {
    console.error('❌ Email fetch error:', err.message);
    await releaseLockedProxy(proxy);
    return;
  }

  const { firstName, lastName } = generateRandomUser();
  const password = `NikeBot!${Math.floor(Math.random() * 90000 + 10000)}`;

  const payload = {
    email,
    password,
    firstName,
    lastName,
    country: 'GB',
    locale: 'en_GB',
    receiveEmail: true,
  };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
    'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
    'x-nike-api-caller-id': 'com.nike.commerce.snkrs.ios',
    'x-nike-request-id': `${Date.now()}.${Math.floor(Math.random() * 1000)}`,
    'x-newrelic-id': 'VQMGUlZVGwEAV1ZRAwcGVVY=',
  };

  try {
    const res = await axios.post(
      'https://api.nike.com/identity/user/create',
      payload,
      {
        headers,
        httpsAgent: agent,
        proxy: false,
        timeout: 15000,
      }
    );

    if (res.data?.id) {
      console.log(`✅ [NikeGen] Created via API: ${email}`);
      await markEmailUsed(email);
    } else {
      console.warn('❌ [NikeGen] Unrecognized API response');
    }

  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.error?.message || err.message;
    console.warn(`⚠️ Nike API failed (${status}): ${message}`);
    console.log('🧪 Falling back to browser creation...');

    try {
      const browserRes = await createNikeAccountWithBrowserAndLogin({
        email,
        password,
        proxy: proxy.formatted,
        firstName,
        lastName,
      });

      if (browserRes?.success) {
        console.log(`✅ [Browser] Created & logged in: ${email}`);
        await markEmailUsed(email);
      } else {
        console.error(`❌ [Browser] Fallback failed: ${browserRes?.error || 'Unknown error'}`);
      }
    } catch (browserErr) {
      console.error('❌ [Browser] Fatal error:', browserErr.message);
    }
  } finally {
    await releaseLockedProxy(proxy);
  }
};
