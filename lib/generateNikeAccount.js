const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { fetch2FACodeFromIMAP } = require('./imap');
const fs = require('fs');
const path = require('path');

const accountsPath = path.join(__dirname, '../data/created_accounts.json');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`👟 [NikeGen] Starting browser-based account creation for: ${user}`);

  let proxy = await getLockedProxy();
  if (!proxy || !proxy.formatted) {
    console.error('❌ No proxy available');
    return;
  }

  let email;
  try {
    email = await getNextEmail();
  } catch (err) {
    console.error('❌ Failed to fetch email:', err.message);
    releaseLockedProxy(proxy);
    return;
  }

  try {
    const result = await createNikeAccountWithBrowser(email, proxy.formatted);

    if (!result || !result.success || !result.email) {
      throw new Error('❌ Account creation failed');
    }

    // Auto-confirm email
    const code = await fetch2FACodeFromIMAP(email);
    if (!code) throw new Error('❌ Failed to fetch 2FA code from email');

    // Save account
    const saved = {
      email,
      password: result.password,
      firstName: result.firstName,
      lastName: result.lastName,
      dob: result.dob,
      proxy: proxy.formatted,
      timestamp: new Date().toISOString()
    };

    fs.mkdirSync(path.dirname(accountsPath), { recursive: true });
    const existing = fs.existsSync(accountsPath) ? JSON.parse(fs.readFileSync(accountsPath)) : [];
    existing.push(saved);
    fs.writeFileSync(accountsPath, JSON.stringify(existing, null, 2));

    markEmailUsed(email);
    console.log(`✅ Account created and saved: ${email}`);
  } catch (err) {
    console.error('❌ Error during generation:', err.message);
  } finally {
    releaseLockedProxy(proxy);
  }
};
