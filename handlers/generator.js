const { connectWithImap } = require('../lib/imapClient');
const { confirmNikeEmail, createNikeSession } = require('../lib/nikeApi');
const { generateRandomUser } = require('../lib/nameGen');

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

  // 🎯 Generate realistic name
  const { firstName, lastName } = generateRandomUser();

  console.log(`👟 Creating Nike account with:
🧑 Name: ${firstName} ${lastName}
📧 Email: ${email}
🔐 Password: ${password}
🌍 Proxy: ${proxyString}`);

  try {
    // Step 1: Create Nike account session
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);
    if (!session || !session.challengeId) throw new Error('❌ Nike session creation failed');
    console.log(`✅ Nike session created for ${email}`);

    // Step 2: Fetch email verification code via IMAP
    const code = await connectWithImap({
      email,
      password,
      imapHost,
      imapPort,
      proxy: proxyString
    });

    if (!code) throw new Error('❌ IMAP verification code not received');
    console.log(`📬 IMAP code received: ${code}`);

    // Step 3: Confirm email with Nike API
    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) throw new Error('❌ Nike email verification failed');

    console.log(`🧼 Nike account verified and clean: ${email}`);

    return {
      email,
      password,
      firstName,
      lastName,
      proxyObject: proxy,
      proxyString: proxyString
    };
  } catch (err) {
    console.error(`❌ Account generation failed: ${err.message}`);
    throw err;
  }
};
