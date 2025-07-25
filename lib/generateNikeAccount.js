require('dotenv').config();
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNextEmail } = require('../lib/emailManager');
const { generatePassword } = require('../lib/utils');
const fs = require('fs');
const path = require('path');

const successLogPath = path.join(__dirname, '../data/created_accounts.json');
if (!fs.existsSync(successLogPath)) fs.writeFileSync(successLogPath, '[]');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`🧠 [NikeGen] Starting generation for user: ${user}`);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) throw new Error('Proxy unavailable');
  } catch (err) {
    console.error('❌ Proxy fetch failed:', err.message);
    return;
  }

  let email;
  try {
    email = await getNextEmail();
  } catch (e) {
    console.error('❌ Email pool exhausted or error:', e.message);
    await releaseLockedProxy(proxy);
    return;
  }

  const password = generatePassword();
  const proxyStr = proxy.formatted;

  console.log(`✏️ [Attempt] Creating ${email} using proxy: ${proxyStr}`);

  const result = await createNikeAccountWithBrowser(email, password, proxyStr);

  if (result.success) {
    const entry = {
      email,
      password,
      proxy: proxyStr,
      createdAt: new Date().toISOString()
    };
    const data = JSON.parse(fs.readFileSync(successLogPath));
    data.push(entry);
    fs.writeFileSync(successLogPath, JSON.stringify(data, null, 2));
    console.log(`✅ [NikeGen] Account created: ${email}`);
  } else {
    console.log(`⛔ Failed to create Nike account after attempts:`, result.error);
  }

  await releaseLockedProxy(proxy);
};
