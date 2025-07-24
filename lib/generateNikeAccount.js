const fs = require('fs');
const path = require('path');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`🧠 [NikeGen] Starting generation for: ${user}`);

  let proxy;
  try {
    proxy = await getLockedProxy('socks5');
    if (!proxy || !proxy.host || !proxy.port) {
      throw new Error('Proxy object is incomplete');
    }
  } catch (err) {
    console.error('❌ [NikeGen] Proxy fetch failed:', err.message);
    return;
  }

  let email;
  try {
    email = await getNextEmail();
  } catch (err) {
    console.error('❌ [NikeGen] Failed to get email:', err.message);
    await releaseLockedProxy(proxy);
    return;
  }

  const password = `Sole!${Math.floor(100000 + Math.random() * 900000)}`;

  try {
    const success = await createNikeAccountWithBrowser(email, password, proxy);
    if (success) {
      console.log(`✅ [NikeGen] Created: ${email}`);
      markEmailUsed(email);
    } else {
      console.log(`❌ [NikeGen] Creation failed for: ${email}`);
    }
  } catch (err) {
    console.error('❌ [NikeGen] Fatal error:', err.message);
  } finally {
    await releaseLockedProxy(proxy);
  }
};
