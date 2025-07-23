require('dotenv').config();
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { generatePassword } = require('../lib/utils');
const { loginNikeAccount } = require('../lib/loginNike');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`👟 [NikeGen] Starting generation for: ${user}`);

  let email;
  try {
    email = await getNextEmail();
    if (!email) throw new Error('No email returned');
  } catch (err) {
    console.error('❌ [NikeGen] Failed to get email:', err.message);
    return null;
  }

  const password = generatePassword();

  for (let attempt = 1; attempt <= 3; attempt++) {
    let proxy;
    try {
      proxy = await getLockedProxy();
      if (!proxy || !proxy.host || !proxy.port || !proxy.username || !proxy.password) {
        throw new Error('Invalid proxy structure');
      }

      const proxyString = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      console.log(`🧪 [NikeGen] Attempt ${attempt} using ${proxyString}`);

      const result = await createNikeAccountWithBrowser(email, password, proxyString);

      if (result && result.success) {
        console.log(`✅ [NikeGen] Account created: ${email}`);
        await markEmailUsed(email);

        // login with same proxy + session
        await loginNikeAccount(email, password, proxyString);

        await releaseLockedProxy(proxy);
        return {
          email,
          password,
          firstName: result.firstName,
          lastName: result.lastName,
          dob: result.dob,
          proxy: proxyString
        };
      } else {
        console.warn(`⚠️ [NikeGen] Attempt ${attempt} failed, trying next proxy...`);
        await releaseLockedProxy(proxy);
      }
    } catch (err) {
      console.error(`❌ [NikeGen] Error on attempt ${attempt}:`, err.message);
      if (proxy) await releaseLockedProxy(proxy);
    }
  }

  console.error(`❌ [NikeGen] All 3 attempts failed for ${email}`);
  return null;
};
