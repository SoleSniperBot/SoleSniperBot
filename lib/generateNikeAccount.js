const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { createNikeAccountWithBrowser } = require('./browserAccountCreator');
const { getNextEmail, markEmailUsed } = require('./emailManager');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`\n🔁 [NikeGen] Starting for: ${user}`);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) {
      console.error('❌ No valid proxy available');
      return;
    }
    console.log(`🌐 Using proxy: ${proxy.formatted}`);
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return;
  }

  let email;
  try {
    email = await getNextEmail();
    if (!email) throw new Error('No email available');
    console.log(`📧 Using email: ${email}`);
  } catch (e) {
    console.error('❌ Email fetch failed:', e.message);
    await releaseLockedProxy(proxy);
    return;
  }

  try {
    const password = `Supreme${Math.floor(Math.random() * 100000)}!`;
    const account = await createNikeAccountWithBrowser(email, password, proxy.formatted);

    if (account && account.success) {
      console.log(`✅ Account created: ${email}`);
      markEmailUsed(email);
    } else {
      console.warn(`⚠️ Account creation failed for: ${email}`);
    }
  } catch (err) {
    console.error('❌ Unexpected error during gen:', err.message);
  } finally {
    await releaseLockedProxy(proxy);
  }
};
