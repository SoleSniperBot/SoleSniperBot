const fs = require('fs');
const path = require('path');
const { fetchNike2FA } = require('../lib/imap');
const { confirmNikeEmail, createNikeSession } = require('../lib/nikeApi');
const { generateRandomUser } = require('../lib/nameGen');
const { getLockedProxy } = require('../lib/proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');
if (!fs.existsSync(accountsPath)) fs.writeFileSync(accountsPath, JSON.stringify([], null, 2));

module.exports = async function generateNikeAccount(inputProxy) {
  console.log('🌐 [Init] Starting account generation...');
  console.log(`📡 Input Proxy Provided: ${!!inputProxy}`);

  // Use input proxy or fallback
  let proxy = inputProxy;
  if (!proxy) {
    console.log('📦 No proxy passed — fetching from manager');
    proxy = await getLockedProxy('autogen');
  }

  // Validate proxy
  if (
    !proxy ||
    typeof proxy !== 'object' ||
    !proxy.ip ||
    !proxy.port ||
    !proxy.username ||
    !proxy.password
  ) {
    console.error('❌ Proxy fields missing or invalid:', proxy);
    throw new Error('Proxy fields missing or incomplete');
  }

  const proxyString = `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`;

  // User identity generation
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;
  const { firstName, lastName } = generateRandomUser();

  console.log(`👟 Creating Nike account for: ${firstName} ${lastName} <${email}>`);
  console.log(`🌍 Using Proxy: ${proxyString}`);

  try {
    // Create session
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);
    if (!session || !session.challengeId) {
      console.error('❌ Nike session creation failed — no challengeId returned');
      throw new Error('Nike session creation failed');
    }

    console.log(`✅ Nike session created. Challenge ID: ${session.challengeId}`);
    console.log(`📬 Waiting for 2FA code to inbox: ${email}`);

    // Wait for email code
    const code = await fetchNike2FA(email, password, proxyString);
    if (!code) {
      console.error('❌ Gmail 2FA code not received for:', email);
      throw new Error('2FA code fetch failed');
    }

    console.log(`📬 Code received: ${code}`);
    console.log(`🔐 Verifying email with Nike...`);

    // Verify challenge
    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) {
      console.error('❌ Nike email verification failed for:', email);
      throw new Error('Email verification failed');
    }

    console.log(`🧼 Account fully created & verified ✅ ${email}`);

    // Save to accounts.json
    const account = {
      email,
      password,
      firstName,
      lastName,
      proxy: proxyString,
      createdAt: new Date().toISOString()
    };

    const existing = JSON.parse(fs.readFileSync(accountsPath));
    existing.push(account);
    fs.writeFileSync(accountsPath, JSON.stringify(existing, null, 2));

    return account;

  } catch (err) {
    console.error(`❌ Account generation failed: ${err.message}`);
    throw err;
  }
};
