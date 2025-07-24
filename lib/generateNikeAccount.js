// lib/generateNikeAccount.js
const fs = require('fs');
const path = require('path');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const {
  generateRandomName,
  generatePassword,
  generateNikeEmail,
  generateRandomDOB
} = require('../lib/utils');

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

  // 📧 Generate email using Gmail trick
  let email;
  try {
    email = await getNextEmail(); // optionally use: generateNikeEmail()
    if (!email) throw new Error('No email available');
  } catch (err) {
    console.error('❌ [NikeGen] Email fetch failed:', err.message);
    await releaseLockedProxy(proxy);
    return;
  }

  const password = generatePassword();
  const { firstName, lastName } = generateRandomName();
  const { day, month, year } = generateRandomDOB();

  try {
    const success = await createNikeAccountWithBrowser({
      email,
      password,
      proxy,
      firstName,
      lastName,
      day,
      month,
      year
    });

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
