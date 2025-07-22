require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { HttpsProxyAgent } = require('hpagent');

const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { saveNikeSessionCookies } = require('../lib/sessionManager');
const {
  generateRandomName,
  generatePassword,
  generateRandomDOB,
  getRandomNikeUserAgent
} = require('../lib/utils');
const loginNikeAccount = require('../lib/loginNike');
const confirmNikeEmail = require('../lib/confirmNikeEmail');

puppeteer.use(StealthPlugin());

const accountsPath = path.join(__dirname, '../data/accounts.json');
if (!fs.existsSync(accountsPath)) fs.writeFileSync(accountsPath, JSON.stringify([]));

function saveAccountToJson(account) {
  const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
  accounts.push(account);
  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
  console.log(`📦 Saved account to accounts.json: ${account.email}`);
}

async function testProxy(proxyFormatted) {
  try {
    const proxyHost = proxyFormatted.split('@')[1];
    const proxyArgs = [`--proxy-server=${proxyHost}`];
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', ...proxyArgs]
    });
    const page = await browser.newPage();

    const [username, pass] = proxyFormatted.split('@')[0].replace('http://', '').split(':');
    await page.authenticate({ username, password: pass });

    await page.goto('https://www.nike.com/gb/launch', { timeout: 10000 });
    await browser.close();
    console.log('✅ Proxy test passed.');
    return true;
  } catch (err) {
    console.warn('❌ Proxy test failed:', err.message);
    return false;
  }
}

module.exports = async function generateNikeAccount(userId = 'system') {
  console.log(`👟 [NikeGen] Starting generation for: ${userId}`);

  const proxy = await getLockedProxy(userId);
  if (!proxy || !proxy.formatted) {
    console.error('❌ Proxy is invalid or empty');
    return null;
  }

  const proxyOk = await testProxy(proxy.formatted);
  if (!proxyOk) {
    await releaseLockedProxy(userId);
    return null;
  }

  let email;
  try {
    email = await getNextEmail();
  } catch (err) {
    console.error('❌ Email rotation error:', err.message);
    await releaseLockedProxy(userId);
    return null;
  }

  const password = generatePassword();
  const { firstName, lastName } = generateRandomName();
  const { day, month, year } = generateRandomDOB();
  const dob = `${year}-${month}-${day}`;
  const userAgent = getRandomNikeUserAgent();

  const payload = {
    email,
    password,
    firstName,
    lastName,
    account: {
      country: 'GB',
      locale: 'en-GB',
      receiveEmail: true
    }
  };

  const headers = {
    'user-agent': userAgent,
    'content-type': 'application/json',
    'accept': 'application/json',
    'x-nike-ux-id': 'com.nike.commerce.snkrs.ios'
  };

  const agent = new HttpsProxyAgent({
    proxy: proxy.formatted,
    keepAlive: true,
    rejectUnauthorized: false
  });

  try {
    const res = await axios.post('https://api.nike.com/identity/user/create', payload, {
      httpsAgent: agent,
      headers,
      timeout: 15000
    });

    if (res.status === 200 && res.data && res.data.id) {
      console.log(`✅ Nike API created account: ${email}`);
      const account = {
        email,
        password,
        firstName,
        lastName,
        dob,
        proxy: proxy.formatted,
        createdAt: new Date().toISOString()
      };
      await markEmailUsed(email);
      saveAccountToJson(account);
      await releaseLockedProxy(userId);
      return account;
    }
  } catch (apiError) {
    console.warn(`⚠️ Nike API error, falling back to browser: ${apiError.message}`);
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        `--proxy-server=${proxy.formatted.split('@')[1]}`
      ]
    });

    const page = await browser.newPage();
    const [proxyUser, proxyPass] = proxy.formatted.split('@')[0].replace('http://', '').split(':');
    await page.authenticate({ username: proxyUser, password: proxyPass });

    await page.setUserAgent(userAgent);
    await page.goto('https://www.nike.com/register', { waitUntil: 'networkidle2', timeout: 20000 });

    await page.type('input[name="emailAddress"]', email);
    await page.type('input[name="password"]', password);
    await page.type('input[name="firstName"]', firstName);
    await page.type('input[name="lastName"]', lastName);
    await page.type('input[name="dateOfBirth"]', dob);

    const checkbox = await page.$('input[name="receiveEmail"]');
    if (checkbox) await checkbox.click();
    const submitBtn = await page.$('input[type="submit"]');
    if (submitBtn) await submitBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    const cookies = await page.cookies();
    await browser.close();

    try {
      await confirmNikeEmail(email);
    } catch (e) {
      console.warn(`⚠️ Email confirm failed: ${e.message}`);
    }

    const account = {
      email,
      password,
      firstName,
      lastName,
      dob,
      proxy: proxy.formatted,
      createdAt: new Date().toISOString()
    };

    saveNikeSessionCookies(email, cookies);
    saveAccountToJson(account);
    await markEmailUsed(email);

    try {
      const parts = proxy.formatted.replace('http://', '').split('@');
      const [username, pass] = parts[0].split(':');
      const host = parts[1];

      await loginNikeAccount(email, password, { host, username, password: pass });
      console.log(`🔓 Auto login successful for ${email}`);
    } catch (loginErr) {
      console.warn(`⚠️ Auto login failed for ${email}: ${loginErr.message}`);
    }

    await releaseLockedProxy(userId);
    return account;

  } catch (err) {
    console.error(`❌ Browser account creation failed: ${err.message}`);
    await releaseLockedProxy(userId);
    return null;
  }
};
