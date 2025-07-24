const path = require('path');
const fs = require('fs');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { generatePassword } = require('../lib/utils');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');

const createdPath = path.join(__dirname, '../data/created_accounts.json');
if (!fs.existsSync(createdPath)) fs.writeFileSync(createdPath, JSON.stringify([]));

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`🧠 [NikeGen] Starting browser-based account creation for: ${user}`);

  let tries = 0;
  const maxTries = 3;

  while (tries < maxTries) {
    let proxy;
    try {
      proxy = await getLockedProxy();
      if (!proxy || !proxy.formatted) {
        console.error('❌ Proxy not available');
        return;
      }
    } catch (err) {
      console.error('❌ Failed to get proxy:', err.message);
      return;
    }

    let email, password;
    try {
      email = await getNextEmail();
      password = generatePassword();
    } catch (e) {
      console.error('❌ Email or password generation error:', e.message);
      await releaseLockedProxy(proxy);
      return;
    }

    const result = await createNikeAccountWithBrowser(email, password, proxy.formatted);

    if (result) {
      const previous = JSON.parse(fs.readFileSync(createdPath));
      previous.push({
        email: result.email,
        password: result.password,
        firstName: result.firstName,
        lastName: result.lastName,
        dob: result.dob,
        proxy: proxy.formatted,
        timestamp: new Date().toISOString()
      });
      fs.writeFileSync(createdPath, JSON.stringify(previous, null, 2));

      console.log(`🎉 [NikeGen] ✅ Created and saved: ${result.email}`);
      await releaseLockedProxy(proxy);
      return result;
    }

    console.log('🔁 Retrying with new proxy...');
    await releaseLockedProxy(proxy);
    tries++;
  }

  console.error('❌ All retries failed. No Nike account created.');
  return null;
};
