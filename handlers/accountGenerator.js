require('dotenv').config();
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const createWithBrowser = require('../lib/browserAccountCreator');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager'); // includes email tracking

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
    email = await getNextEmail(); // Pull next available email
  } catch (e) {
    console.error('❌ Email rotation error:', e.message);
    await releaseLockedProxy(proxy);
    return;
  }

  const payload = {
    email,
    password: 'NikeSniper123!',
    firstName: 'Chris',
    lastName: 'Brown',
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
    'x-nike-request-id': `${Date.now()}.${Math.floor(Math.random() * 1000)}`, // spoofed request ID
    'x-newrelic-id': 'VQMGUlZVGwEAV1ZRAwcGVVY=', // mimics iOS app telemetry
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
    } else {
      console.warn('❌ [NikeGen] Unknown response format:', response.data);
    }

  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.error?.message || err.message;

    console.warn(`⚠️ Nike API failed (${status}): ${message}`);

    // Trigger browser fallback on 401 or 5xx
    if (status === 401 || status >= 500 || !status) {
      console.log('🧪 Falling back to browser automation...');
      try {
        const fallback = await createWithBrowser({
          email,
          password: payload.password,
          proxy: proxy.formatted
        });

        if (fallback?.fallbackUsed) {
          console.log(`✅ [Browser] Account created: ${email}`);
          await markEmailUsed(email);
        } else {
          console.error('❌ [Browser] Fallback also failed.');
        }
      } catch (browserErr) {
        console.error('❌ [Browser] Unexpected error:', browserErr.message);
      }
    }
  } finally {
    await releaseLockedProxy(proxy);
  }
};
