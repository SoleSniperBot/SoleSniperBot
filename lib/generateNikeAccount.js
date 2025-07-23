require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const loginToNikeAndSaveSession = require('../lib/loginNike');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log('🧠 [NikeGen] Starting generation for:', user);

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

  const proxyString = proxy.formatted;
  console.log(`🖊️ [NikeGen] Attempt 1 using ${proxyString}`);

  let email;
  try {
    email = await getNextEmail();
  } catch (e) {
    console.error('❌ Email rotation error:', e.message);
    await releaseLockedProxy(proxy);
    return;
  }

  try {
    const account = await createNikeAccountWithBrowser(email, null, proxyString);
    if (!account || !account.email) {
      throw new Error('Nike account creation failed');
    }

    console.log(`✅ [NikeGen] Account created: ${account.email}`);

    // Save email as used
    await markEmailUsed(email);

    // Immediately login with same session + proxy
    console.log(`👤 [NikeLogin] Logging in for ${account.email}`);
    await loginToNikeAndSaveSession(account.email, account.password, proxyString);
  } catch (err) {
    console.error('❌ [NikeGen] Error during creation:', err.message);
  } finally {
    await releaseLockedProxy(proxy);
  }
};
