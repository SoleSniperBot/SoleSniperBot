require('dotenv').config();
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log('👟 [NikeGen] Starting generation for:', user);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) {
      console.error('❌ Proxy is invalid or empty');
      return { success: false, reason: 'proxy_missing' };
    }
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return { success: false, reason: 'proxy_error' };
  }

  const agent = new HttpsProxyAgent(proxy.formatted);

  let email;
  try {
    email = await getNextEmail();
  } catch (e) {
    console.error('❌ Email rotation error:', e.message);
    await releaseLockedProxy(proxy);
    return { success: false, reason: 'email_error' };
  }

  const password = 'NikeSniper123!';
  const payload = {
    email,
    password,
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
        timeout: 15000,
      }
    );

    if (response.data?.id) {
      console.log(`✅ [NikeGen] Account created via API: ${email}`);
      await markEmailUsed(email);
      await releaseLockedProxy(proxy);
      return { success: true, email };
    } else {
      console.warn('❌ [NikeGen] Unknown response:', response.data);
    }

  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.error?.message || err.message;
    console.warn(`⚠️ Nike API failed (${status}): ${message}`);
  }

  // === BROWSER FALLBACK ===
  console.log('🧪 Falling back to browser automation...');
  try {
    const result = await createNikeAccountWithBrowser(email, password, proxy.formatted);
    if (result === true) {
      console.log(`✅ [Browser] Account created: ${email}`);
      await markEmailUsed(email);
      await releaseLockedProxy(proxy);
      return { success: true, email, fallback: true };
    } else {
      console.error(`❌ [Browser] Fallback failed for: ${email}`);
    }
  } catch (browserErr) {
    console.error('❌ [Browser] Error:', browserErr.message);
  }

  await releaseLockedProxy(proxy);
  return { success: false, reason: 'all_failed' };
};
