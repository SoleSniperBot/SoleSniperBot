require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { fetchNike2FACodeAndConfirm } = require('../lib/imap');
const { loginWithBrowser } = require('../lib/loginNike');
const {
  generateNikeEmail,
  generatePassword,
  generateRandomName,
  generateRandomDOB
} = require('../lib/utils');

const accountsPath = path.join(__dirname, '../data/created_accounts.json');
if (!fs.existsSync(accountsPath)) {
  fs.writeFileSync(accountsPath, JSON.stringify([]));
}

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`🧠 [NikeGen] Starting browser-based account creation for: ${user}`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) {
      console.log('❌ No proxy available, aborting.');
      return;
    }

    console.log(`🧪 [Attempt ${attempt}] Using proxy: ${proxy.formatted}`);

    // Generate realistic identity
    const email = generateNikeEmail();
    const password = generatePassword();
    const { firstName, lastName } = generateRandomName();
    const dob = generateRandomDOB();

    const accountData = {
      email,
      password,
      firstName,
      lastName,
      dob,
      proxy: proxy.formatted,
      timestamp: new Date().toISOString()
    };

    try {
      const success = await createNikeAccountWithBrowser(
        proxy.formatted,
        email,
        password,
        firstName,
        lastName,
        dob
      );

      if (!success) throw new Error('Account creation failed');

      console.log('📨 Waiting for IMAP 2FA code...');
      await fetchNike2FACodeAndConfirm(email);

      console.log('🔐 Logging into newly created account...');
      const loginSuccess = await loginWithBrowser(email, password, proxy.formatted);

      if (!loginSuccess) {
        console.warn('⚠️ Login after creation failed — still saving account');
      }

      // ✅ Save created account
      const existing = JSON.parse(fs.readFileSync(accountsPath));
      existing.push(accountData);
      fs.writeFileSync(accountsPath, JSON.stringify(existing, null, 2));
      console.log(`✅ [NikeGen] Account created: ${email}`);
      await releaseLockedProxy(proxy);
      return accountData;

    } catch (err) {
      console.error(`❌ [Attempt ${attempt}] Failed: ${err.message}`);
      await releaseLockedProxy(proxy);
    }
  }

  console.log('❌ All retries failed. No Nike account created.');
  return null;
};
