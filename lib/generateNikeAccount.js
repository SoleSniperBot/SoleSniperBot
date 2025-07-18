require('dotenv').config();
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const loginNike = require('../lib/loginNike');
const fs = require('fs');
const path = require('path');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`👟 [NikeGen] Starting account generation for: ${user}`);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) {
      console.error('❌ No proxies left or formatted proxy missing.');
      return;
    }
    console.log(`🔐 Using proxy: ${proxy.formatted}`);
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return;
  }

  let email;
  try {
    email = await getNextEmail();
    console.log(`📧 Using email: ${email}`);
  } catch (err) {
    console.error('❌ Email rotation error:', err.message);
    await releaseLockedProxy(proxy);
    return;
  }

  const password = `Sole${Math.floor(Math.random() * 1000000)}!`;

  try {
    const account = await createNikeAccountWithBrowser(email, password, proxy.formatted);
    if (!account || !account.success) {
      console.error('❌ Nike creation failed or returned invalid object.');
      await releaseLockedProxy(proxy);
      return;
    }

    // Save created email to used
    await markEmailUsed(email);

    console.log(`✅ Nike account created: ${email}`);

    // Auto login to confirm session is good
    const loginSuccess = await loginNike(email, password, proxy.formatted);
    if (loginSuccess) {
      console.log(`🔐 Login success for ${email}`);
    } else {
      console.warn(`⚠️ Login failed or 2FA required for ${email}`);
    }

    // Save session or handle here...

  } catch (err) {
    console.error(`❌ Error in creation flow for ${email}:`, err.message);
  }

  await releaseLockedProxy(proxy);
};
