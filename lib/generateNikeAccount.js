// lib/generateNikeAccount.js
require('dotenv').config();
const { createNikeAccountWithBrowser } = require('./browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { getNextEmail, markEmailUsed } = require('./emailManager');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log('👟 [NikeGen] Starting generation for:', user);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted || !proxy.formatted.includes('socks5://')) {
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
    const password = 'SoleSniper#' + Math.floor(10000 + Math.random() * 90000);
    const account = await createNikeAccountWithBrowser(email, password, proxy.formatted);
    console.log('✅ Account created:', account.email);
    markEmailUsed(email);
  } catch (err) {
    console.error('❌ Account creation failed:', err.message);
  } finally {
    await releaseLockedProxy(proxy);
  }
};
