require('dotenv').config();
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { generatePassword, generateNikeEmail } = require('../lib/utils');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`👟 [NikeGen] Starting generation for: ${user}`);

  let email;
  try {
    email = await getNextEmail();
    if (!email) throw new Error('No email returned');
  } catch (err) {
    console.error('❌ [NikeGen] Failed to get email:', err.message);
    return;
  }

  const password = generatePassword();
  const ports = [10000, 10001, 10002];
  let success = false;

  for (let i = 0; i < ports.length; i++) {
    const port = ports[i];
    let proxy;

    try {
      proxy = await getLockedProxy();
      if (!proxy || !proxy.host || !proxy.username || !proxy.password) {
        throw new Error('Invalid proxy structure');
      }

      const proxyString = `http://${proxy.username}:${proxy.password}@${proxy.host}:${port}`;
      console.log(`🔁 [NikeGen] Attempt ${i + 1} using proxy port ${port} for email ${email}`);

      const result = await createNikeAccountWithBrowser(email, password, proxyString);

      if (result && result.success) {
        console.log(`✅ [NikeGen] Account created: ${email}`);
        success = true;
        await markEmailUsed(email);
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
        console.warn(`⚠️ [NikeGen] Failed on port ${port}, retrying...`);
        await releaseLockedProxy(proxy);
      }
    } catch (err) {
      console.error(`❌ [NikeGen] Error on port ${port}:`, err.message);
      if (proxy) await releaseLockedProxy(proxy);
    }
  }

  if (!success) {
    console.error(`❌ [NikeGen] Failed to generate Nike account after 3 attempts for ${email}`);
    return null;
  }
};
