const fs = require('fs');
const path = require('path');
const { fetchNike2FA } = require('../lib/imap');
const { confirmNikeEmail, createNikeSession } = require('../lib/nikeApi');
const { generateRandomUser } = require('../lib/nameGen');
const { getLockedProxy } = require('../lib/proxyManager');

const accountsPath = path.join(__dirname, '../data/accounts.json');
if (!fs.existsSync(accountsPath)) fs.writeFileSync(accountsPath, JSON.stringify([], null, 2));

module.exports = async function generateNikeAccount(inputProxy = null) {
  try {
    console.log('🌐 [Init] Starting account generation...');
    console.log(`📡 Input Proxy Provided: ${!!inputProxy}`);

    // Use provided proxy or fallback from manager
    let proxy = inputProxy;
    if (!proxy || typeof proxy !== 'object') {
      console.log('📦 No valid input proxy — pulling from proxy manager...');
      proxy = await getLockedProxy('autogen');
    }

    // Validate proxy structure
    const required = ['ip', 'port', 'username', 'password'];
    const missing = required.filter((k) => !proxy?.[k]);

    if (missing.length > 0) {
      console.error(`❌ Missing proxy field(s): ${missing.join(', ')}`);
      console.error('🧩 Proxy provided:', proxy);
      throw new Error('Proxy fields missing or incomplete');
    }

    const proxyString = `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`;
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    const email = `solesniper+${timestamp}@gmail.com`;
    const password = `TempPass!${randomNum}`;
    const { firstName, lastName } = generateRandomUser();

    console.log(`👟 Generating Nike for: ${firstName} ${lastName} <${email}>`);
    console.log(`🌍 Proxy in use: ${proxyString}`);

    // 1. Create Nike session
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);
    if (!session || !session.challengeId) {
      throw new Error('Nike session creation failed (no challengeId)');
    }
    console.log(`✅ Session created. Challenge ID: ${session.challengeId}`);

    // 2. Wait for code via IMAP
    const code = await fetchNike2FA(email, password, proxyString);
    if (!code) throw new Error('2FA code fetch failed via IMAP');
    console.log(`📩 Code received: ${code}`);

    // 3. Confirm email
    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) throw new Error('Nike email verification failed');
    console.log(`🔒 Email verified ✅`);

    // 4. Save
    const account = {
      email,
      password,
      firstName,
      lastName,
      proxy: proxyString,
      createdAt: new Date().toISOString()
    };

    const existing = fs.existsSync(accountsPath)
      ? JSON.parse(fs.readFileSync(accountsPath, 'utf8'))
      : [];

    existing.push(account);
    fs.writeFileSync(accountsPath, JSON.stringify(existing, null, 2));
    console.log(`💾 Account saved: ${email}`);

    return account;
  } catch (err) {
    console.error(`❌ Account generation error: ${err.message}`);
    return null; // Graceful return so Railway won’t crash
  }
};
