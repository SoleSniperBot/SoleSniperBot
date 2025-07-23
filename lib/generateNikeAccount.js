// handlers/generateNikeAccount.js
require('dotenv').config();
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const fs = require('fs');
const path = require('path');

module.exports = async function generateNikeAccount(user = 'default') {
  console.log(`🧠 [NikeGen] Starting generation for: ${user}`);
  let proxy;

  try {
    proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) {
      console.error('❌ Proxy is invalid or empty');
      return;
    }
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return;
  }

  try {
    const email = await getNextEmail();
    const password = `BotSniper${Math.floor(Math.random() * 100000)}!`;

    const account = await createNikeAccountWithBrowser(email, password, proxy.formatted);
    if (account && account.email) {
      console.log(`✅ [NikeGen] Account created: ${account.email}`);
      markEmailUsed(email);

      // Save to file
      const savePath = path.join(__dirname, '../data/created_accounts.json');
      const existing = fs.existsSync(savePath) ? JSON.parse(fs.readFileSync(savePath)) : [];
      existing.push({ ...account, proxy: proxy.formatted, createdAt: new Date().toISOString() });
      fs.writeFileSync(savePath, JSON.stringify(existing, null, 2));
    } else {
      console.error('❌ [NikeGen] Account creation failed or returned no email');
    }
  } catch (err) {
    console.error('❌ [NikeGen] Error during creation:', err.message);
  } finally {
    releaseLockedProxy(proxy);
  }
};
