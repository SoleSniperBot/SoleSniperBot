const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { getNextEmail, markEmailUsed } = require('./emailManager');
const imap = require('./imap');

module.exports = async function generateNikeAccount(user = 'autobot') {
  console.log('👟 [Gen] Starting Nike account creation...');

  const proxy = await getLockedProxy();
  if (!proxy || !proxy.formatted) throw new Error('No proxy available');

  const email = await getNextEmail();
  const password = 'Sole1234!';
  const firstName = 'Mark';
  const lastName = 'Phillips';
  const dob = '1998-01-01';

  const tlsBinary = path.resolve(__dirname, '../bin/tls-client');
  const payload = JSON.stringify({
    email,
    password,
    firstName,
    lastName,
    dob,
    proxy: proxy.formatted
  });

  try {
    console.log(`🌐 [TLS] Launching TLS-client with proxy ${proxy.formatted}`);
    execSync(`${tlsBinary} --method POST --url https://www.nike.com/registration --body '${payload}' --proxy ${proxy.formatted}`);
    console.log(`✅ [Gen] Account created: ${email}`);

    const code = await imap.getNikeCode(email);
    if (!code) throw new Error('2FA code not received');

    console.log(`📩 [IMAP] Confirmed code: ${code}`);
    await markEmailUsed(email);
    return { email, password };
  } catch (err) {
    console.error('❌ [Gen Error]', err.message);
    return null;
  } finally {
    await releaseLockedProxy(proxy);
  }
};
