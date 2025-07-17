const { createNikeAccountWithBrowser } = require('./browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { generateRandomEmail, generateRandomPassword } = require('./utils');

async function generateNikeAccount(userId, index = 0) {
  const email = generateRandomEmail(index);
  const password = generateRandomPassword();

  const proxy = getLockedProxy();
  if (!proxy) {
    console.log('❌ No valid proxy available.');
    return { success: false, reason: 'no_proxy' };
  }

  try {
    console.log(`👟 [NikeGen] Starting generation for: ${email}`);
    const success = await createNikeAccountWithBrowser(email, password, proxy);

    if (success) {
      console.log(`✅ [Browser] Account created: ${email}`);
      return { success: true, email, password };
    } else {
      return { success: false, reason: 'browser_failed' };
    }
  } catch (err) {
    console.error(`❌ Error generating account: ${err.message}`);
    return { success: false, reason: 'error' };
  } finally {
    releaseLockedProxy(proxy);
  }
}

module.exports = { generateNikeAccount };
