const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');

const sessionsPath = path.join(__dirname, '../data/sessions.json');
const profilesPath = path.join(__dirname, '../data/profiles.json');
const tlsClientPath = path.join(__dirname, '../tls-client'); // Linux binary (no extension)

async function checkoutNike(sku, size, userId = null) {
  const sessions = JSON.parse(fs.readFileSync(sessionsPath));
  const profiles = JSON.parse(fs.readFileSync(profilesPath));

  const userSessions = userId
    ? sessions.filter((a) => a.userId === userId)
    : sessions;

  if (!userSessions.length) {
    console.error('❌ No sessions available for checkout');
    return { success: false, reason: 'No sessions' };
  }

  for (let session of userSessions) {
    const proxy = await getLockedProxy();
    if (!proxy) {
      console.error('❌ No proxy available for checkout');
      continue;
    }

    const { formatted } = proxy;
    const profile = profiles[userId]?.[0]; // Take first profile
    if (!profile) {
      await releaseLockedProxy(proxy);
      return { success: false, reason: 'No profile found' };
    }

    try {
      console.log(`🛒 Attempting checkout for ${session.email} on ${sku} [${size}]`);

      const payload = {
        skuId: sku,
        size: size,
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          address: profile.address,
          city: profile.city,
          postcode: profile.postcode,
          country: profile.country || 'GB',
          phoneNumber: profile.phone,
          email: session.email,
          cardNumber: profile.cardNumber,
          expiry: profile.expiry,
          cvv: profile.cvv
        }
      };

      const args = [
        '--url', `https://api.nike.com/checkout/submit`,
        '--method', 'POST',
        '--body', JSON.stringify(payload),
        '--headers', JSON.stringify({
          'authorization': `Bearer ${session.access_token}`,
          'user-agent': 'Nike/93 (iPhone; iOS 16.2; Scale/3.00)',
          'content-type': 'application/json',
          'accept-language': 'en-GB'
        }),
        '--proxy', formatted
      ];

      const result = await runTLSClient(args);
      const json = JSON.parse(result);

      if (json.success || result.includes('"status":"success"')) {
        console.log(`✅ Checkout successful for ${session.email}`);
        await releaseLockedProxy(proxy);
        return { success: true, email: session.email };
      }

      console.warn(`❌ Checkout failed for ${session.email}:`, result);
    } catch (err) {
      console.error('💥 Error during checkout:', err.message);
    }

    await releaseLockedProxy(proxy);
  }

  return { success: false };
}

function runTLSClient(args) {
  return new Promise((resolve, reject) => {
    execFile(tlsClientPath, args, { timeout: 20000 }, (err, stdout) => {
      if (err) return reject(err);
      return resolve(stdout.trim());
    });
  });
}

module.exports = { checkoutNike };
