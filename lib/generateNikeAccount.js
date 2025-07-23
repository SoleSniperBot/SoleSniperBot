require('dotenv').config();
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const {
  generateRandomName,
  generatePassword,
  generateNikeEmail,
  getRandomNikeUserAgent,
  generateRandomDOB
} = require('../lib/utils');
const loginNikeAccount = require('../lib/loginNike');

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

      const proxyString = `socks5://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      console.log(`🧪 [NikeGen] Attempt ${attempt} using ${proxyString}`);

      const result = await createNikeAccountWithBrowser(email, password, proxyString);

      if (result && result.success) {
        console.log(`✅ [NikeGen] Account created: ${email}`);
        await markEmailUsed(email);

        try {
          const loginSuccess = await loginNikeAccount(email, password, proxyString);
          if (loginSuccess) {
            console.log(`🔐 [NikeGen] Login confirmed + session saved for ${email}`);
          } else {
            console.warn(`⚠️ [NikeGen] Login failed after creation for ${email}`);
          }
        } catch (loginErr) {
          console.error(`❌ [NikeGen] Login threw error: ${loginErr.message}`);
        }

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
        console.warn(`⚠️ [NikeGen] Attempt ${attempt} failed with proxy`);
        await releaseLockedProxy(proxy);
      }
    } catch (err) {
      console.error(`❌ [NikeGen] Error on attempt ${attempt}:`, err.message);
      if (proxy) await releaseLockedProxy(proxy);
    }
  }

  console.log('🔁 [NikeGen] All SOCKS5 attempts failed, falling back to default browser mode...');

  try {
    const fallback = await createNikeAccountWithBrowser(email, password, null); // No proxy
    if (fallback && fallback.success) {
      await markEmailUsed(email);
      await loginNikeAccount(email, password, null);
      console.log(`✅ [NikeGen] Fallback browser account created: ${email}`);

      return {
        email,
        password,
        firstName: fallback.firstName,
        lastName: fallback.lastName,
        dob: fallback.dob,
        proxy: 'none (fallback)'
      };
    }
  } catch (fallbackErr) {
    console.error('❌ [NikeGen] Fallback failed:', fallbackErr.message);
  }

  console.error(`❌ [NikeGen] All attempts failed for ${email}`);
  return null;
};
