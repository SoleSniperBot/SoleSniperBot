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
  console.log(`👟 Creating Nike account: ${firstName} ${lastName} (${email})`);
  console.log(`🛡️ Proxy: ${safeProxy}`);

  try {
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);
    if (!session || !session.challengeId) throw new Error('No challengeId');

    console.log('✅ API session successful');
    const code = await connectWithImap({ email, password, imapHost, imapPort, proxy: proxyString });
    if (!code) throw new Error('No IMAP 2FA code');

    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) throw new Error('Nike verification failed');

    console.log(`🧼 Nike API account verified: ${email}`);
    return { email, password, firstName, lastName, proxy: proxyString };
  } catch (err) {
    console.warn(`⚠️ API path failed: ${err.message}`);
    console.log('🖥️ Fallback to Puppeteer...');
    try {
      const browserFallback = await createNikeAccountWithBrowser(email, password, proxyString);
      if (!browserFallback) throw new Error('Puppeteer fallback failed');
      console.log(`✅ Browser fallback success: ${email}`);
      return { email, password, firstName, lastName, proxy: proxyString };
    } catch (browserErr) {
      console.error(`❌ Browser fallback error: ${browserErr.message}`);
      throw new Error('Nike account creation failed.');
    }
  }
};
