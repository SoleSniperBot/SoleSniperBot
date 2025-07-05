const { connectWithImap } = require('../lib/imapClient');
const { confirmNikeEmail, createNikeSession } = require('../lib/nikeApi');
const { generateRandomUser } = require('../lib/nameGen');

module.exports = async function generateNikeAccount(proxyString, ctx) {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;
  const imapHost = 'imap.gmail.com';
  const imapPort = 993;

  // 🎯 Realistic name
  const { firstName, lastName } = generateRandomUser();
  console.log(`👟 Creating Nike account for: ${firstName} ${lastName} <${email}>`);
  console.log(`🌍 Using Proxy: ${proxyString}`);

  try {
    // Step 1: Create Nike account session
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);
    if (!session || !session.challengeId) throw new Error('Nike session creation failed');
    console.log(`✅ Session created for ${email}`);

    // Step 2: Fetch IMAP 2FA code
    const code = await connectWithImap({
      email,
      password,
      imapHost,
      imapPort,
      proxy: proxyString
    });

    if (!code) throw new Error('IMAP verification code not received');
    console.log(`📬 IMAP code received: ${code}`);

    // Step 3: Confirm email
    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) throw new Error('Nike email verification failed');

    console.log(`🧼 Nike account verified: ${email}`);
    return { email, password, firstName, lastName, proxy: proxyString };

  } catch (err) {
    console.error(`❌ Account generation failed: ${err.message}`);
    throw err;
  }
};
