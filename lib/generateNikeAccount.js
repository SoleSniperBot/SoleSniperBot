const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { SocksProxyAgent } = require('socks-proxy-agent');
const axios = require('axios');

async function testNikeProxy(proxyUrl) {
  try {
    const agent = new SocksProxyAgent(proxyUrl);
    const res = await axios.get('https://www.nike.com/gb', {
      httpsAgent: agent,
      timeout: 8000,
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`👟 [NikeGen] Starting account generation for: ${user}`);

  let proxy = null;
  let email = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      proxy = await getLockedProxy();
      if (!proxy || !proxy.formatted) {
        console.log(`❌ [Attempt ${attempt}] No proxy available`);
        continue;
      }

      console.log(`🌐 [Attempt ${attempt}] Testing proxy: ${proxy.formatted}`);
      const isValid = await testNikeProxy(proxy.formatted);
      if (!isValid) {
        console.log('🚫 Proxy failed test, retrying...');
        await releaseLockedProxy(proxy);
        continue;
      }

      email = await getNextEmail();
      if (!email) throw new Error('📧 No emails available');

      console.log(`🧪 Creating Nike account with ${email}...`);
      const result = await createNikeAccountWithBrowser(email, proxy.formatted);
      console.log(`🎉 Account created: ${result.email}`);
      markEmailUsed(email);

      await releaseLockedProxy(proxy);
      return; // Exit after success

    } catch (err) {
      console.error(`❌ [Attempt ${attempt}] Failed: ${err.message}`);
      if (proxy) await releaseLockedProxy(proxy);
    }
  }

  console.log('⛔ All 3 attempts failed. No account created.');
};
