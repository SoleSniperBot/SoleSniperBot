const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { generateNikeEmail, generatePassword } = require('../lib/utils');

async function generateNikeAccount(userId, index = 0) {
  const email = generateNikeEmail();
  const password = generatePassword();
  const proxy = getLockedProxy();

  if (!proxy) {
    console.log('❌ No valid proxy available.');
    return { success: false, reason: 'no_proxy' };
  }

  try {
    console.log(`👟 [NikeGen] Starting gen ${index + 1} for: ${email}`);
    const success = await createNikeAccountWithBrowser(email, password, proxy);

    if (success) {
      console.log(`✅ [Browser] Account created: ${email} | ${password}`);
      return { success: true, email, password };
    } else {
      console.log(`❌ [Browser] Failed to create account: ${email}`);
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
