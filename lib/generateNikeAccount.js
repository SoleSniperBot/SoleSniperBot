const { connectWithImap } = require('../lib/imapClient');
const { confirmNikeEmail, createNikeSession } = require('../lib/nikeApi');
const { createNikeAccountWithBrowser } = require('../lib/browserAccountCreator');
const { generateRandomUser } = require('../lib/nameGen');

module.exports = async function generateNikeAccount(proxyString, ctx) {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;
  const imapHost = 'imap.gmail.com';
  const imapPort = 993;

  const { firstName, lastName } = generateRandomUser();
  const safeProxy = proxyString.replace(/:\/\/.*?:.*?@/, '://****:****@');

  console.log(`👟 Creating account for: ${firstName} ${lastName} <${email}>`);
  console.log(`🛡️ Proxy used: ${safeProxy}`);

  try {
    // Step 1: Attempt API session
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);

    if (!session || !session.challengeId) {
      throw new Error('Nike API session failed. Skipping to browser fallback.');
    }

    console.log(`✅ API session created for ${email}`);

    // Step 2: Pull IMAP 2FA code
    const code = await connectWithImap({
      email,
      password,
      imapHost,
      imapPort,
      proxy: proxyString
    });

    if (!code) throw new Error('IMAP code not found.');
    console.log(`📬 Code received via IMAP: ${code}`);

    // Step 3: Confirm Nike email
    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) throw new Error('Email verification failed.');

    console.log(`🧼 Verified account: ${email}`);
    return { email, password, firstName, lastName, proxy: proxyString };

  } catch (err) {
    console.warn(`⚠️ API flow failed: ${err.message}`);
    console.log('🖥️ Trying browser fallback...');

    const browserSuccess = await createNikeAccountWithBrowser(email, password, proxyString);
    if (browserSuccess) {
      return { email, password, firstName, lastName, proxy: proxyString };
    }

    console.error('❌ Both API and browser fallback failed.');
    throw new Error('Nike account creation failed.');
  }
};
