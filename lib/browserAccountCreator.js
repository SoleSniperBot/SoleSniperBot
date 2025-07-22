require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('hpagent');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { saveNikeSessionCookies } = require('../lib/sessionManager');
const {
  generateRandomName,
  generateRandomDOB,
  generatePassword,
  getRandomNikeUserAgent
} = require('../lib/utils');
const loginNikeAccount = require('../lib/loginNike');

const accountsPath = path.join(__dirname, '../data/accounts.json');
if (!fs.existsSync(accountsPath)) {
  fs.writeFileSync(accountsPath, JSON.stringify([]));
}

function saveAccountToJson(account) {
  const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
  accounts.push(account);
  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
  console.log(`📦 Saved account: ${account.email}`);
}

module.exports = async function generateNikeAccount(userId = 'system') {
  console.log(`👟 [NikeGen] Creating account for: ${userId}`);

  const proxy = await getLockedProxy(userId);
  if (!proxy || !proxy.formatted) {
    console.error('❌ No working proxy available');
    return null;
  }

  let email;
  try {
    email = await getNextEmail();
  } catch (err) {
    console.error('❌ Email pool exhausted:', err.message);
    await releaseLockedProxy(userId);
    return null;
  }

  const password = generatePassword();
  const { firstName, lastName } = generateRandomName();
  const { day, month, year } = generateRandomDOB();
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
    'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
    'x-newrelic-id': 'VQMGUl5ADRAEXFlRCgc=',
    'x-nike-visitid': `${Math.floor(Math.random() * 10000000000)}`,
    'x-nike-api-caller-id': 'com.nike.commerce.snkrs.ios',
    'x-nike-api-version': '1.0',
    'x-nike-app-id': 'com.nike.commerce.snkrs',
    'content-type': 'application/json',
    'accept': 'application/json'
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
      console.log(`✅ Nike API created: ${email}`);
      const account = {
        email,
        password,
        firstName,
        lastName,
        dob: `${year}-${month}-${day}`,
        proxy: proxy.formatted,
        createdAt: new Date().toISOString()
      };

      await markEmailUsed(email);
      saveAccountToJson(account);
      await releaseLockedProxy(userId);
      return account;
    }
  } catch (apiError) {
    console.warn(`⚠️ Nike API error. Fallback to browser: ${apiError.message}`);
  }

  const fallback = await createNikeAccountWithBrowser(email, password, proxy.formatted);

  if (fallback && fallback.session) {
    console.log(`✅ Fallback browser created: ${email}`);
    const account = {
      email,
      password,
      firstName,
      lastName,
      dob: `${year}-${month}-${day}`,
      proxy: proxy.formatted,
      createdAt: new Date().toISOString()
    };

    await markEmailUsed(email);
    saveNikeSessionCookies(email, fallback.session);
    saveAccountToJson(account);

    try {
      const [auth, host] = proxy.formatted.replace('http://', '').split('@');
      const [username, pass] = auth.split(':');
      await loginNikeAccount(email, password, { host, username, password: pass });
      console.log(`🔓 Logged in successfully: ${email}`);
    } catch (e) {
      console.warn(`⚠️ Login failed: ${e.message}`);
    }

    await releaseLockedProxy(userId);
    return account;
  }

  console.error(`❌ Account creation failed for ${email}`);
  await releaseLockedProxy(userId);
  return null;
};
