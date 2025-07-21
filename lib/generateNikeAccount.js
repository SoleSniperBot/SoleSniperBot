require('dotenv').config();
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { getNextEmail, markEmailUsed } = require('./emailManager');
const { confirmNikeEmail, createNikeAccount } = require('./nikeApi');
const loginNike = require('./loginNike');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`👟 [NikeGen] Starting for: ${user}`);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy) {
      console.error('❌ No proxy available');
      return;
    }
    console.log(`🌍 Using proxy: ${proxy.host}:${proxy.port}`);
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return;
  }

  let email;
  try {
    email = await getNextEmail();
    console.log(`📧 Email: ${email}`);
  } catch (err) {
    console.error('❌ Email error:', err.message);
    await releaseLockedProxy(proxy);
    return;
  }

  const password = `Sole${Math.floor(Math.random() * 999999)}!`;
  const firstName = 'Mark';
  const lastName = 'Phillips';

  try {
    const result = await createNikeAccount({ email, password, proxy, firstName, lastName });
    if (!result || !result.success) throw new Error('Account creation failed');

    const confirmed = await confirmNikeEmail(email, proxy);
    if (!confirmed) throw new Error('Email confirmation failed');

    await markEmailUsed(email);
    console.log(`✅ Account created: ${email} | Logging in...`);

    const loginSuccess = await loginNike(email, password, proxy);
    if (loginSuccess) {
      console.log(`🔐 Login successful for ${email}`);
    } else {
      console.warn(`⚠️ Login failed or 2FA required: ${email}`);
    }

  } catch (err) {
    console.error(`❌ [${email}] Error: ${err.message}`);
  }

  await releaseLockedProxy(proxy);
};
