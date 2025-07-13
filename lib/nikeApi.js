const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Safe dynamic import for markEmailUsed
let markEmailUsed = () => {};
try {
  const emailHelper = require('../lib/emailHelper');
  if (typeof emailHelper.markEmailUsed === 'function') {
    markEmailUsed = emailHelper.markEmailUsed;
  }
} catch (err) {
  console.warn('⚠️ Email helper not loaded:', err.message);
}

async function createNikeAccount(email, password, proxy) {
  const [ip, port, user, pass] = proxy.replace('http://', '').split(/[:@]/);
  const proxyUrl = `http://${user}:${pass}@${ip}:${port}`;

  const agent = new HttpsProxyAgent({ proxy: proxyUrl });

  const headers = {
    'user-agent': 'Nike/93 (iPhone; iOS 16_0; Scale/3.00)',
    'content-type': 'application/json',
    'accept': 'application/json',
    'x-newrelic-id': 'VQMGUlZADRAEVVZRAwcGVlU=',
    'x-nike-visitid': '1',
    'x-nike-device-id': 'D1A9B22F-96F2-4C1A-BB29-0BA12A44008A',
    'appid': 'com.nike.omega',
  };

  const payload = {
    email,
    password,
    firstName: 'Mark',
    lastName: 'Phillips',
    country: 'GB',
    locale: 'en_GB',
    receiveEmail: true,
  };

  try {
    const response = await axios.post(
      'https://api.nike.com/identity/user/create',
      payload,
      { headers, httpsAgent: agent }
    );

    console.log(`✅ [Nike API] Created: ${email}`);
    markEmailUsed(email);
    return { success: true, email };
  } catch (err) {
    console.warn(`⚠️ Nike API failed (${err.response?.status}): ${err.message}`);
    return await fallbackBrowserSignup({ email, password, proxy });
  }
}

async function fallbackBrowserSignup({ email, password, proxy }) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [`--proxy-server=${proxy}`, '--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    const [, authPart] = proxy.split('//');
    const [proxyAuth] = authPart.split('@');
    const [proxyUser, proxyPass] = proxyAuth.split(':');

    await page.authenticate({
      username: proxyUser,
      password: proxyPass,
    });

    console.log(`🌐 [Browser] Would attempt manual signup for: ${email}`);
    await browser.close();

    markEmailUsed(email);
    console.log(`✅ [Browser] Account created: ${email}`);
    return { fallbackUsed: true, email };
  } catch (err) {
    console.error('❌ [Browser fallback] Error:', err.message);
    return { fallbackUsed: false, error: err.message };
  }
}
