require('dotenv').config();
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const path = require('path');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log('👟 [NikeGen] Starting generation for:', user);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy || !proxy.includes('http://')) {
      console.error('❌ No usable proxy found');
      return;
    }
  } catch (err) {
    console.error('❌ Proxy fetch error:', err.message);
    return;
  }

  let email;
  try {
    email = await getNextEmail();
  } catch (err) {
    console.error('❌ Email fetch failed:', err.message);
    await releaseLockedProxy(proxy);
    return;
  }

  try {
    const account = await createNikeAccountWithBrowser(email, 'SoleSniper#' + Math.floor(10000 + Math.random() * 90000), proxy);
    console.log('✅ Account created:', account.email);
    markEmailUsed(email);
  } catch (err) {
    console.error('❌ Account creation failed:', err.message);
  } finally {
    await releaseLockedProxy(proxy);
  }
};
