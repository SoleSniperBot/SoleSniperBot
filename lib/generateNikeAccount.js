require('dotenv').config();
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { generateRandomUser } = require('../lib/nameGen'); // For dynamic names

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`👟 [NikeGen] Starting generation for: ${user}`);

  // Lock proxy
  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) {
      console.error('❌ No valid proxy');
      return;
    }
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return;
  }

  const agent = new HttpsProxyAgent(proxy.formatted);

  // Get email
  let email;
  try {
    email = await getNextEmail();
  } catch (e) {
    console.error('❌ Email rotation error:', e.message);
    await releaseLockedProxy(proxy);
    return;
  }

  // Generate name + password
  const { firstName, lastName } = generateRandomUser();
  const password = `Nike${Math.floor(100000 + Math.random() * 900000)}!`;

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
        timeout: 15000,
      }
    );

    if (response.data?.id) {
      console.log(`✅ [NikeGen] Account created via API: ${email}`);
      await markEmailUsed(email);
    } else {
      throw new Error('❓ Unexpected response format');
    }

  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.error?.message || err.message;
    console.warn(`⚠️ Nike API failed (${status}): ${message}`);
    console.log('🧪 Attempting browser fallback...');

    try {
      const success = await createNikeAccountWithBrowser(email, password, proxy.formatted);
      if (success) {
        console.log(`✅ [Browser] Account created: ${email}`);
        await markEmailUsed(email);
      } else {
        throw new Error('Fallback failed');
      }
    } catch (browserErr) {
      console.error(`❌ [Browser] Error: ${browserErr.message}`);
    }
  } finally {
    await releaseLockedProxy(proxy);
  }
};
