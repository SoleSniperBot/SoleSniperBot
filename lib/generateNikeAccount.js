require('dotenv').config();
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { getNextEmail } = require('./emailManager');
const { createNikeAccountWithBrowser } = require('./browserAccountCreator');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log('👟 [NikeGen] Starting generation for:', user);

  let proxyObj;
  try {
    proxyObj = await getLockedProxy();
    if (!proxyObj || !proxyObj.formatted) throw new Error('Proxy is invalid or empty');
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return;
  }

  let email;
  try {
    email = await getNextEmail();
  } catch (e) {
    console.error('❌ Email rotation error:', e.message);
    await releaseLockedProxy(proxyObj);
    return;
  }

  try {
    const result = await createNikeAccountWithBrowser(email, 'TestPassword123!', proxyObj.formatted);
    console.log('✅ Account created:', result.email);
  } catch (err) {
    console.error(err.message);
  } finally {
    await releaseLockedProxy(proxyObj);
  }
};
