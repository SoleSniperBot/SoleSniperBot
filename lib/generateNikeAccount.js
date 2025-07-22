require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('hpagent');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { saveNikeSessionCookies } = require('../lib/sessionManager');
const { generateRandomName, generatePassword } = require('../lib/utils');
const loginNikeAccount = require('../lib/loginNike');

const accountsPath = path.join(__dirname, '../data/accounts.json');
if (!fs.existsSync(accountsPath)) {
  fs.writeFileSync(accountsPath, JSON.stringify([]));
}

function saveAccountToJson(account) {
  const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
  accounts.push(account);
  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
  console.log(`📦 Saved account to accounts.json: ${account.email}`);
}

module.exports = async function generateNikeAccount(userId = 'system') {
  console.log(`👟 [NikeGen] Starting account generation for: ${userId}`);

  const proxy = await getLockedProxy(userId);
  if (!proxy || !proxy.formatted) {
    console.error('❌ Proxy is invalid or empty');
    return null;
  }

  let email;
  try {
    email = await getNextEmail();
  } catch (err) {
    console.error('❌ Failed to get next email:', err.message);
    await releaseLockedProxy(userId);
    return null;
  }

  const password = generatePassword();
  const { firstName, lastName } = generateRandomName();

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
    'user-agent': 'Nike/97 (iPhone; iOS 15.6; Scale/3.00)',
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

  const fallback = await createNikeAccountWithBrowser(email, password, proxy.formatted);

  if (fallback && fallback.session) {
    console.log(`✅ Browser created account: ${email}`);
    const account = {
      email,
      password,
      firstName,
      lastName,
      proxy: proxy.formatted,
      createdAt: new Date().toISOString()
    };

    await markEmailUsed(email);
    saveNikeSessionCookies(email, fallback.session);
    saveAccountToJson(account);

    try {
      await loginNikeAccount(email, password, proxy.formatted);
      console.log(`🔓 Auto login successful for ${email}`);
    } catch (loginErr) {
      console.warn(`⚠️ Auto login failed for ${email}:`, loginErr.message);
    }

    await releaseLockedProxy(userId);
    return account;
  }

  console.error(`❌ Account creation failed in browser fallback for ${email}`);
  await releaseLockedProxy(userId);
  return null;
};
