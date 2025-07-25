require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { createNikeAccountWithBrowser } = require('./browserAccountCreator');
const { markEmailUsed, getNextEmail } = require('./emailManager');
const loginNike = require('../handlers/loginNike');

const createdPath = path.join(__dirname, '../data/created_accounts.json');
if (!fs.existsSync(createdPath)) fs.writeFileSync(createdPath, '[]');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`👟 [NikeGen] Starting generation for: ${user}`);

  let tries = 0;
  let accountCreated = false;

  while (tries < 3 && !accountCreated) {
    tries++;
    const proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) {
      console.error('❌ Proxy is invalid or unavailable');
      continue;
    }

    let email;
    try {
      email = await getNextEmail();
    } catch (err) {
      console.error(`❌ Email fetch failed: ${err.message}`);
      await releaseLockedProxy(proxy);
      return;
    }

    const password = 'Sniper' + Math.floor(100000 + Math.random() * 900000) + '!';
    console.log(`🧪 [Attempt ${tries}] Creating ${email} using proxy: ${proxy.formatted}`);

    try {
      const result = await createNikeAccountWithBrowser(email, password, proxy.formatted);
      if (!result || !result.success) throw new Error('Browser creation failed');

      const data = {
        email,
        password,
        proxy: proxy.formatted,
        firstName: result.firstName,
        lastName: result.lastName,
        dob: result.dob,
        timestamp: new Date().toISOString()
      };

      const all = JSON.parse(fs.readFileSync(createdPath));
      all.push(data);
      fs.writeFileSync(createdPath, JSON.stringify(all, null, 2));

      await markEmailUsed(email);
      await loginNike(email, password, email.split('@')[0]); // session ID = prefix

      console.log(`✅ [NikeGen] Account created and logged in: ${email}`);
      accountCreated = true;

    } catch (err) {
      console.error(`❌ [NikeGen Error] ${err.message}`);
    }

    await releaseLockedProxy(proxy);
  }

  if (!accountCreated) {
    console.log('⛔ Failed to create Nike account after 3 attempts.');
  }
};
