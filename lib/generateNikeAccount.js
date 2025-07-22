require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { HttpsProxyAgent } = require('hpagent');
const { createNikeAccountWithBrowser } = require('./browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { getNextEmail, markEmailUsed } = require('./emailManager');
const { saveNikeSessionCookies } = require('./sessionManager');
const { generateRandomName, generateNikeEmail, generatePassword } = require('./utils');
const { loginNikeAccount } = require('./login'); // 🆕 Auto login import

// 📁 Path to store created accounts
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

  let proxy;
  try {
    proxy = await getLockedProxy(userId);
    if (!proxy || !proxy.formatted) {
      console.error('❌ Proxy is invalid or empty');
      return null;
    }
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return null;
  }

  const httpsAgent = new HttpsProxyAgent({
    proxy: proxy.formatted,
    keepAlive: true,
    rejectUnauthorized: false
  });

  let email;
  try {
    email = await getNextEmail();
  } catch (e) {
    console.error('❌ Email rotation error:', e.message);
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
    'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
    'x-newrelic-id': 'VQMGUF5SGwEGVVlbBAcBVw=='
  };

  try {
    const res = await axios.post('https://api.nike.com/identity/user/create', payload, { httpsAgent, headers });

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
    } else {
      console.warn(`⚠️ API failed, falling back to browser...`);
    }
  } catch (apiError) {
    console.warn('⚠️ Nike API error, falling back to browser:', apiError.message);
  }

  // 🌐 Browser fallback
  try {
    const account = await createNikeAccountWithBrowser(email, password, proxy.formatted);
    if (account && account.session) {
      console.log(`✅ Browser created account: ${email}`);
      const result = {
        email,
        password,
        firstName,
        lastName,
        proxy: proxy.formatted,
        createdAt: new Date().toISOString()
      };
      await markEmailUsed(email);
      saveNikeSessionCookies(email, account.session);
      saveAccountToJson(result);

      // 🔐 Auto login after creation
      try {
        await loginNikeAccount(email, password, proxy.formatted); // optional proxy arg
        console.log(`🔓 Auto login successful for ${email}`);
      } catch (loginErr) {
        console.warn(`⚠️ Auto login failed for ${email}:`, loginErr.message);
      }

      await releaseLockedProxy(userId);
      return result;
    } else {
      console.error(`❌ Account creation failed in browser fallback for ${email}`);
      await releaseLockedProxy(userId);
      return null;
    }
  } catch (err) {
    console.error('❌ Nike account generation failed:', err.message);
    await releaseLockedProxy(userId);
    return null;
  }
};
