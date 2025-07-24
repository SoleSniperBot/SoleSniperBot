// lib/generateNikeAccount.js
const fs = require('fs');
const path = require('path');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`🧠 [NikeGen] Starting generation for: ${user}`);

  let proxy;
  try {
    proxy = await getLockedProxy('socks5');
    if (!proxy || !proxy.formatted) {
      throw new Error('No valid proxy found');
    }
    console.log('🧩 Using Proxy:', proxy.formatted);
  } catch (err) {
    console.error('❌ [NikeGen] Proxy fetch failed:', err.message);
    return;
  }

  let email;
  try {
    email = await getNextEmail();
    if (!email) throw new Error('No email available');
  } catch (err) {
    console.error('❌ [NikeGen] Email fetch failed:', err.message);
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
      console.error(`❌ [NikeGen] Creation failed: ${email}`);
    }
  } catch (err) {
    console.error('❌ [NikeGen] Fatal error during creation:', err.message);
  } finally {
    await releaseLockedProxy(proxy);
  }
};
