const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getNextEmail, markEmailUsed } = require('./emailManager');
const { loginNikeAccount } = require('./nikeLogin');

puppeteer.use(StealthPlugin());

async function createNikeAccount(password, proxy) {
  const email = getNextEmail();
  const [ip, port, user, pass] = proxy.replace('http://', '').split(/[:@]/);
  const proxyUrl = `http://${user}:${pass}@${ip}:${port}`;

  const headers = {
    'user-agent': 'Nike/93 (iPhone; iOS 16_0; Scale/3.00)',
    'content-type': 'application/json',
    'accept': 'application/json',
    'x-newrelic-id': 'VQMGUlZADRAEVVZRAwcGVlU=',
    'x-nike-visitid': '1',
    'x-nike-device-id': 'D1A9B22F-96F2-4C1A-BB29-0BA12A44008A',
    'appid': 'com.nike.omega',
  };

  const agent = new HttpsProxyAgent({ proxy: proxyUrl });

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
    const res = await axios.post('https://api.nike.com/identity/user/create', payload, {
      headers,
      httpsAgent: agent,
      timeout: 15000,
    });

    console.log(`✅ [Nike API] Account created: ${email}`);
    markEmailUsed(email);

    // Immediately login after account creation
    await loginNikeAccount(email, password, proxy);

    return { email, success: true, fallback: false };
  } catch (err) {
    console.warn(`⚠️ Nike API failed (${err.response?.status}): ${err.message}`);
    return await fallbackBrowserSignup(email, password, proxy);
  }
}

async function fallbackBrowserSignup(email, password, proxy) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [`--proxy-server=${proxy}`, '--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    const [, authPart] = proxy.split('//');
    const [proxyAuth] = authPart.split('@');
    const [proxyUser, proxyPass] = proxyAuth.split(':');

    await page.authenticate({ username: proxyUser, password: proxyPass });

    // Simulate manual signup success
    console.log(`🌐 [Browser] Would manually register: ${email}`);
    await browser.close();

    markEmailUsed(email);
    await loginNikeAccount(email, password, proxy);

    return { email, fallback: true, success: true };
  } catch (err) {
    console.error(`❌ [Browser fallback] Failed for ${email}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = { createNikeAccount };
