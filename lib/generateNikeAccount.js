require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const createNikeAccountWithBrowser = require('../lib/browserAccountCreator');
const loginToNikeAndSaveSession = require('../lib/loginNike');
const { getNextEmail, markEmailUsed } = require('../lib/emailManager');
const { generateRandomName, generatePassword } = require('../lib/utils');

module.exports = async function generateNikeAccount(triggeredBy = 'manual') {
  console.log(`🧠 [NikeGen] Starting generation for: ${triggeredBy}`);

  let proxyObj;
  try {
    proxyObj = await getLockedProxy();
    if (!proxyObj || !proxyObj.formatted) {
      console.error('❌ No working proxy found');
      return;
    }
  } catch (err) {
    console.error('❌ Proxy lock failed:', err.message);
    return;
  }

  const proxy = proxyObj.formatted;
  const firstName = generateRandomName();
  const lastName = generateRandomName();
  const dob = '1996-05-15';

  let email;
  try {
    email = await getNextEmail();
  } catch (err) {
    console.error('❌ Email rotation failed:', err.message);
    await releaseLockedProxy(proxyObj);
    return;
  }

  const password = generatePassword();

  try {
    const result = await createNikeAccountWithBrowser(email, password, firstName, lastName, dob, proxy);

    if (result.success) {
      console.log(`✅ [NikeGen] Account created: ${email}`);

      // 🔐 Immediately login using same browser settings and proxy
      await loginToNikeAndSaveSession({
        email,
        password,
        proxy
      });

      markEmailUsed(email);

      // Save to working accounts
      const accPath = path.join(__dirname, '../data/working_accounts.json');
      const accounts = fs.existsSync(accPath) ? JSON.parse(fs.readFileSync(accPath)) : [];
      accounts.push({ email, password, proxy, createdAt: new Date().toISOString() });
      fs.writeFileSync(accPath, JSON.stringify(accounts, null, 2));
    } else {
      console.error('❌ [NikeGen] Account creation failed');
    }
  } catch (err) {
    console.error(`❌ [NikeGen] Error during creation:`, err.message);
  } finally {
    await releaseLockedProxy(proxyObj);
  }
};
