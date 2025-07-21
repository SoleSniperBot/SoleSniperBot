const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const { getNextEmail, markEmailUsed } = require('./emailManager');
const { saveNikeSessionCookies } = require('./cookieManager');
const { generateRandomName, generateNikeEmail, generatePassword } = require('./utils');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { createWithBrowser } = require('./browserAccountCreator');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`👟 [NikeGen] Starting account creation for: ${user}`);

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

  let email;
  try {
    email = await getNextEmail();
  } catch (err) {
    console.error('❌ Email rotation error:', err.message);
    await releaseLockedProxy(proxy);
    return;
  }

  const password = generatePassword();
  const { firstName, lastName } = generateRandomName();

  try {
    const account = await createWithBrowser(email, password, proxy.formatted, firstName, lastName);

    if (account && account.session) {
      console.log(`✅ Account created: ${email}`);
      await markEmailUsed(email);
      await saveNikeSessionCookies(email, account.session);
    } else {
      console.error(`❌ Account creation failed in browser fallback for ${email}`);
    }
  } catch (err) {
    console.error('❌ Nike account generation failed:', err.message);
  } finally {
    await releaseLockedProxy(proxy);
  }
};
