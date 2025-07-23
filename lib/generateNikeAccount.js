// handlers/generateNikeAccount.js
const path = require('path');
const fs = require('fs');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { generateNikeEmail, generateRandomName, generatePassword } = require('../lib/utils');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { loginToNikeAndSaveSession } = require('../lib/loginNike');
const { markEmailUsed } = require('../lib/emailManager');

const ACCOUNTS_PATH = path.join(__dirname, '../data/created_accounts.json');

if (!fs.existsSync(ACCOUNTS_PATH)) {
  fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify([]));
}

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`🧠 [NikeGen] Starting generation for: ${user}`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    let proxy;
    try {
      proxy = await getLockedProxy();
      if (!proxy || !proxy.host) {
        console.error('❌ Proxy is invalid or empty');
        return;
      }
    } catch (err) {
      console.error('❌ Failed to get proxy:', err.message);
      return;
    }

    console.log(`🔐 Proxy locked for ${user}: http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`);
    console.log(`🧪 [NikeGen] Attempt ${attempt} using http://${proxy.host}:${proxy.port}`);

    // Generate random details
    const firstName = generateRandomName();
    const lastName = generateRandomName();
    const email = generateNikeEmail();
    const password = generatePassword();

    try {
      const success = await createNikeAccountWithBrowser(email, password, firstName, lastName, proxy);
      if (!success) throw new Error('Browser account creation failed');

      console.log(`✅ [NikeGen] Account created: ${email}`);
      await markEmailUsed(email);

      const loginSuccess = await loginToNikeAndSaveSession(email, password, proxy);
      if (!loginSuccess) throw new Error('Login failed after account creation');

      const accountData = {
        email,
        password,
        firstName,
        lastName,
        dob: '1996-04-15',
        proxy,
        createdAt: new Date().toISOString()
      };

      const existing = JSON.parse(fs.readFileSync(ACCOUNTS_PATH));
      existing.push(accountData);
      fs.writeFileSync(ACCOUNTS_PATH, JSON.stringify(existing, null, 2));

      await releaseLockedProxy(proxy);
      return email;
    } catch (err) {
      console.error(`❌ [NikeGen] Attempt ${attempt} failed: ${err.message}`);
      await releaseLockedProxy(proxy);
    }
  }

  console.error(`❌ [NikeGen] All 3 attempts failed for ${user}`);
  return null;
};
