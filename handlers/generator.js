const { connectWithImap } = require('./imapClient');
const { confirmNikeEmail, createNikeSession } = require('./nikeApi');
const { generateRandomUser } = require('./nameGen'); // Optional but useful

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

  console.log(`👟 Creating Nike account using proxy:\n${JSON.stringify(proxy, null, 2)}`);

  try {
    // Step 1: Create Nike account session
    const session = await createNikeSession(email, password, proxyString);
    if (!session || !session.challengeId) throw new Error('❌ Nike session creation failed');
    console.log(`✅ Session created for ${email}`);

    // Step 2: Wait for IMAP verification code
    const code = await connectWithImap({
      email,
      password, // Gmail app password (must match IMAP setup)
      imapHost,
      imapPort,
      proxy: proxyString
    });

    if (!code) throw new Error('❌ IMAP verification code not received');
    console.log(`📬 IMAP code received: ${code}`);

    // Step 3: Confirm email via real Nike API
    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) throw new Error('❌ Nike email verification failed');

    console.log(`🧼 Nike account verified: ${email}`);

    return { email, password, proxy };
  } catch (err) {
    console.error(`❌ Account generation failed: ${err.message}`);
    throw err;
  }
};
