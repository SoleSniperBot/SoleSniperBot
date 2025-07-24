require('dotenv').config();
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail } = require('../lib/emailManager');
const fs = require('fs');
const path = require('path');

const savePath = path.join(__dirname, '../data/created_accounts.json');
if (!fs.existsSync(savePath)) fs.writeFileSync(savePath, '[]');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`\n👟 [NikeGen] Starting generation for: ${user}`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    let proxy;
    try {
      proxy = await getLockedProxy();
      if (!proxy || !proxy.formatted) {
        console.error('❌ No available proxy');
        return;
      }
    } catch (err) {
      console.error('❌ Proxy lock failed:', err.message);
      return;
    }

    let email;
    try {
      email = await getNextEmail();
    } catch (e) {
      console.error('❌ Email fetch failed:', e.message);
      await releaseLockedProxy(proxy);
      return;
    }

    const password = 'SoleSniper' + Math.floor(100000 + Math.random() * 900000);

    const result = await createNikeAccountWithBrowser(email, password, proxy.formatted);

    if (result) {
      const saved = JSON.parse(fs.readFileSync(savePath));
      saved.push({
        email: result.email,
        password: result.password,
        proxy: result.proxy,
        createdAt: new Date().toISOString()
      });
      fs.writeFileSync(savePath, JSON.stringify(saved, null, 2));
      console.log(`✅ Account saved: ${result.email}`);
      await releaseLockedProxy(proxy);
      return result;
    } else {
      console.log(`⚠️ Attempt ${attempt} failed, rotating proxy...`);
      await releaseLockedProxy(proxy);
    }
  }

  console.error('❌ All proxy attempts failed after 3 tries');
};
