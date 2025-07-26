// lib/generateNikeAccount.js
const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { createNikeAccountWithBrowser } = require('./browserAccountCreator');
const { fetchNike2FACodeAndConfirm } = require('./imap');
const { loginWithBrowser } = require('./loginNike');
const { generateNikeEmail, generatePassword, generateRandomName, generateRandomDOB } = require('./utils');

const accountsPath = path.join(__dirname, '../data/created_accounts.json');
if (!fs.existsSync(accountsPath)) fs.writeFileSync(accountsPath, JSON.stringify([]));

module.exports = async function generateNikeAccount(user = 'system') {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const proxy = await getLockedProxy();
    if (!proxy) return null;

    const { formatted, host, port, username, password } = proxy;
    console.log(`🧪 [Attempt ${attempt}] Using proxy: ${formatted}`);

    const clean = { host, port, username, password };

    const email = generateNikeEmail();
    const passwordVal = generatePassword();
    const { firstName, lastName } = generateRandomName();
    const dob = generateRandomDOB();

    const accountData = { email, password: passwordVal, firstName, lastName, dob, proxy: formatted, timestamp: new Date().toISOString() };

    try {
      const success = await createNikeAccountWithBrowser(clean, email, passwordVal, firstName, lastName, dob);
      if (!success) throw new Error('Account creation failed');

      await fetchNike2FACodeAndConfirm(email);
      const login = await loginWithBrowser(email, passwordVal, clean);
      if (!login.success) console.warn('⚠️ Creation succeeded, login failed');

      const all = JSON.parse(fs.readFileSync(accountsPath));
      all.push(accountData);
      fs.writeFileSync(accountsPath, JSON.stringify(all, null, 2));
      await releaseLockedProxy(proxy);

      return accountData;
    } catch (e) {
      console.error(`❌ [Attempt ${attempt}] ${e.message}`);
      await releaseLockedProxy(proxy);
    }
  }
  return null;
};
