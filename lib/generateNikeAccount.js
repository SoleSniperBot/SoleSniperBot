require('dotenv').config();
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { generateRandomUser } = require('../lib/nameGen');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`👟 [NikeGen] Started for: ${user}`);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy?.formatted) throw new Error('Proxy missing or malformed');
  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    return;
  }

  const agent = new HttpsProxyAgent(proxy.formatted);
  let email, password, firstName, lastName;

  try {
    email = await getNextEmail();
    const userData = generateRandomUser();
    password = `Nike${Math.floor(Math.random() * 9000 + 1000)}!`;
    firstName = userData.firstName;
    lastName = userData.lastName;
  } catch (e) {
    console.error('❌ Email/name generation error:', e.message);
    await releaseLockedProxy(proxy);
    return;
  }

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
    'Accept': 'application/json',
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
      console.log(`✅ [Nike API] Created: ${email}`);
      await markEmailUsed(email);
    } else {
      console.warn('❌ [NikeGen] Unknown API response:', response.data);
    }

  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.error?.message || err.message;

    console.warn(`⚠️ API failed (${status}): ${message}`);
    console.log('🧪 Falling back to browser...');

    try {
      const success = await createNikeAccountWithBrowser(email, password, proxy.formatted, firstName, lastName);
      if (success) {
        console.log(`✅ [Browser] Account created: ${email}`);
        await markEmailUsed(email);
      } else {
        console.error('❌ [Browser] Fallback failed for:', email);
      }
    } catch (browserErr) {
      console.error('❌ [Browser] Error:', browserErr.message);
    }
  } finally {
    await releaseLockedProxy(proxy);
  }
};
