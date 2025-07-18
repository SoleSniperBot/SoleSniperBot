require('dotenv').config();
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { generateRandomUser } = require('../lib/nameGen');
// Optional: Auto-login after creation
// const { loginToNike } = require('../lib/loginClient');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log('👟 [NikeGen] Starting generation for:', user);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) {
      console.error('❌ Proxy is invalid or empty');
      return;
    }
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return;
  }

  const agent = new HttpsProxyAgent(proxy.formatted);

  let email;
  try {
    email = await getNextEmail();
  } catch (e) {
    console.error('❌ Email rotation error:', e.message);
    await releaseLockedProxy(proxy);
    return;
  }

  const { firstName, lastName } = generateRandomUser();
  const password = 'NikeSniper123!';

  const payload = {
    email,
    password,
    firstName,
    lastName,
    country: 'GB',
    locale: 'en_GB',
    receiveEmail: true
  };

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
    'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
    'x-nike-api-caller-id': 'com.nike.commerce.snkrs.ios',
    'x-nike-request-id': `${Date.now()}.${Math.floor(Math.random() * 1000)}`,
    'x-newrelic-id': 'VQMGUlZVGwEAV1ZRAwcGVVY=',
  };

  try {
    const response = await axios.post(
      'https://api.nike.com/identity/user/create',
      payload,
      {
        headers,
        httpsAgent: agent,
        proxy: false,
        timeout: 15000
      }
    );

    if (response.data?.id) {
      console.log(`✅ [NikeGen] Account created via API: ${email}`);
      await markEmailUsed(email);

      // Optional: trigger login
      // await loginToNike(email, password, proxy.formatted);

    } else {
      console.warn('❌ [NikeGen] Unknown response format:', response.data);
    }

  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.error?.message || err.message;

    console.warn(`⚠️ Nike API failed (${status}): ${message}`);
    console.log('🧪 Falling back to browser automation...');

    try {
      let fallbackSuccess = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        console.log(`🌀 Attempt ${attempt}: Trying browser fallback for ${email}...`);
        fallbackSuccess = await createNikeAccountWithBrowser(email, password, proxy.formatted);

        if (fallbackSuccess) {
          console.log(`✅ [Browser] Account created: ${email}`);
          await markEmailUsed(email);

          // Optional: auto-login after browser generation
          // await loginToNike(email, password, proxy.formatted);

          break;
        } else {
          console.warn(`❌ Attempt ${attempt} failed`);
        }
      }

      if (!fallbackSuccess) {
        console.error(`🚫 [Final Fail] Browser fallback failed for ${email}`);
      }

    } catch (browserErr) {
      console.error(`❌ [Browser] Error: ${browserErr.message}`);
    }
  } finally {
    await releaseLockedProxy(proxy);
  }
};
