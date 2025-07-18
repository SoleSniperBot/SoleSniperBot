// generateNikeAccount.js
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const HttpsProxyAgent = require('https-proxy-agent');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');

const sessionsPath = path.join(__dirname, '../data/sessions.json');
if (!fs.existsSync(sessionsPath)) fs.writeFileSync(sessionsPath, JSON.stringify([]));

module.exports = async function generateNikeAccount(user = 'system') {
  console.log('👟 [NikeGen] Starting generation for:', user);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy?.formatted) throw new Error('No valid proxy');
  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    return;
  }

  const agent = new HttpsProxyAgent(proxy.formatted);

  let email;
  try {
    email = await getNextEmail();
  } catch (err) {
    console.error('❌ Email rotation failed:', err.message);
    await releaseLockedProxy(proxy);
    return;
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
        timeout: 15000
      }
    );

    if (response.data?.id) {
      console.log(`✅ [NikeGen] Account created via API: ${email}`);
      await markEmailUsed(email);
    } else {
      console.warn('❌ [NikeGen] Unexpected API response:', response.data);
    }

  } catch (err) {
    const status = err.response?.status;
    console.warn(`⚠️ Nike API failed (${status}): ${err.message}`);
    console.log('🧪 Falling back to browser...');

    try {
      const browserResult = await createNikeAccountWithBrowser(email, password, proxy.formatted);

      if (browserResult?.cookies && browserResult.success) {
        console.log(`✅ [Browser] Created: ${email}`);

        // Save cookies
        const existing = JSON.parse(fs.readFileSync(sessionsPath));
        existing.push({ email, password, cookies: browserResult.cookies });
        fs.writeFileSync(sessionsPath, JSON.stringify(existing, null, 2));

        await markEmailUsed(email);
      } else {
        console.error('❌ [Browser] Fallback failed.');
      }

    } catch (browserErr) {
      console.error('❌ [Browser] Error:', browserErr.message);
    }
  } finally {
    await releaseLockedProxy(proxy);
  }
};
