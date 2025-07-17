// lib/generateNikeAccount.js
const { connectWithImap } = require('./imapClient');
const { confirmNikeEmail, createNikeSession } = require('./nikeApi');
const { createNikeAccountWithBrowser } = require('./browserAccountCreator');
const { generateRandomUser } = require('./nameGen');

module.exports = async function generateNikeAccount(proxyString, ctx) {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;
  const imapHost = 'imap.gmail.com';
  const imapPort = 993;

  const { firstName, lastName } = generateRandomUser();
  const safeProxy = proxyString.replace(/:\/\/.*?:.*?@/, '://****:****@');

  console.log(`👟 Creating Nike account: ${firstName} ${lastName} <${email}>`);
  console.log(`🧩 Using proxy: ${safeProxy}`);

  try {
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);

    if (!session || !session.challengeId) {
      throw new Error('Nike API session failed (challengeId missing)');
    }

    console.log(`✅ Session created for ${email}, waiting for IMAP code...`);
    const code = await connectWithImap({
      email,
      password,
      imapHost,
      imapPort,
      proxy: proxyString
    });

    if (!code) throw new Error('IMAP code not retrieved');
    console.log(`📩 IMAP Code received: ${code}`);

    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) throw new Error('Email verification failed via API');

    console.log(`🧼 API account verified: ${email}`);
    return { email, password, firstName, lastName, proxy: proxyString };
  } catch (err) {
    console.warn(`⚠️ API flow failed for ${email}: ${err.message}`);
    console.log(`🖥️ Trying browser fallback for ${email}...`);

    const browserSuccess = await createNikeAccountWithBrowser(email, password, proxyString);
    if (browserSuccess) {
      console.log(`✅ Browser fallback succeeded for ${email}`);
      return { email, password, firstName, lastName, proxy: proxyString };
    }

    console.error(`❌ Total failure for ${email}`);
    return null;
  }
};
