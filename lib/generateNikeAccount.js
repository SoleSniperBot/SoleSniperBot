const fs = require('fs');
const path = require('path');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`🧠 [NikeGen] Starting generation for: ${user}`);

  let email;
  try {
    email = await getNextEmail();
  } catch (err) {
    console.error('❌ [NikeGen] Failed to get email:', err.message);
    return;
  }

  const password = `Sole!${Math.floor(100000 + Math.random() * 900000)}`;

  let success = false;
  let attempts = 0;
  let proxy;

  while (!success && attempts < 3) {
    attempts++;

    try {
      proxy = await getLockedProxy('socks5');
      if (!proxy || !proxy.host || !proxy.port) {
        throw new Error('❌ Proxy is incomplete or missing');
      }

      console.log(`🌐 [NikeGen] Attempt ${attempts} using proxy ${proxy.formatted}`);
      success = await createNikeAccountWithBrowser(email, password, proxy);

      if (success) {
        console.log(`✅ [NikeGen] Account created: ${email}`);
        markEmailUsed(email);
      } else {
        console.warn(`⚠️ [NikeGen] Creation failed with proxy, trying next...`);
      }
    } catch (err) {
      console.error(`❌ [NikeGen] Error on attempt ${attempts}:`, err.message);
    } finally {
      if (proxy) await releaseLockedProxy(proxy);
    }
  }

  if (!success) {
    console.error(`🛑 [NikeGen] Failed after 3 proxy attempts: ${email}`);
  }
};
