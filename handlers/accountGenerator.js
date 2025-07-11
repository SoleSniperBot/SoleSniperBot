require('dotenv').config();
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const createWithBrowser = require('../lib/browserAccountCreator');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log('👟 [NikeGen] Starting generation for:', user);

  let proxy;
  try {
    proxy = await getLockedProxy();
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return;
  }

  if (!proxy || !proxy.formatted) {
    console.error('❌ Proxy missing fields');
    return;
  }

  const agent = new HttpsProxyAgent(proxy.formatted);
  const email = `solesniper+${Date.now()}@gmail.com`;
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
    'User-Agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
    'Accept': 'application/json',
    'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
    'x-nike-api-caller-id': 'com.nike.commerce.snkrs.ios'
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

    if (response.data && response.data.id) {
      console.log(`✅ [NikeGen] Account created: ${email}`);
    } else {
      console.warn('❌ [NikeGen] Unknown response format');
      console.log(response.data);
    }

  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;

    console.warn(`⚠️ Nike API failed (${status}):`, data?.error?.message || err.message);

    if (status >= 500 || !status) {
      console.log('🧪 Falling back to browser automation...');
      const fallback = await createWithBrowser({
        email,
        password: payload.password,
        proxy: proxy.formatted
      });

      if (fallback?.fallbackUsed) {
        console.log(`✅ [Browser] Created via fallback: ${email}`);
      } else {
        console.error('❌ [Browser] Fallback also failed.');
      }
    }
  } finally {
    await releaseLockedProxy(proxy);
  }
};
