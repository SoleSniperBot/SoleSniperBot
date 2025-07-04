const fs = require('fs');
const path = require('path');
const { connectWithImap } = require('../lib/imapClient');
const { confirmNikeEmail, createNikeSession } = require('../lib/nikeApi');
const { generateRandomUser } = require('../lib/nameGen');

const accountsPath = path.join(__dirname, '../data/accounts.json');

module.exports = async function generateNikeAccount(proxy) {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;
  const imapHost = 'imap.gmail.com';
  const imapPort = 993;

  const proxyString = proxy
    ? `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`
    : null;

  const { firstName, lastName } = generateRandomUser();

  console.log(`👟 Creating Nike account with:
🧑 ${firstName} ${lastName}
📧 ${email}
🔐 ${password}
🌐 Proxy: ${proxyString}`);

  try {
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);
    if (!session || !session.challengeId) throw new Error('❌ Nike session creation failed');
    console.log(`✅ Session created for ${email}`);

    const code = await connectWithImap({
      email,
      password,
      imapHost,
      imapPort,
      proxy: proxyString
    });

    if (!code) throw new Error('❌ IMAP verification code not received');
    console.log(`📬 IMAP code received: ${code}`);

    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) throw new Error('❌ Nike email verification failed');
    console.log(`🧼 Nike account verified: ${email}`);

    const accountData = {
      email,
      password,
      firstName,
      lastName,
      proxy: proxyString,
      createdAt: new Date().toISOString()
    };

    let accounts = [];
    if (fs.existsSync(accountsPath)) {
      accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    }
    accounts.push(accountData);
    fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));
    console.log('💾 Account saved to accounts.json');

    return accountData;
  } catch (err) {
    console.error(`❌ Account generation failed: ${err.message}`);
    throw err;
  }
};
