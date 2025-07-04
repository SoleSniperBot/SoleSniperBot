const { connectWithImap } = require('./imapClient');
const { confirmNikeEmail, createNikeSession } = require('./nikeApi'); // placeholder
const { generateRandomUser } = require('./nameGen'); // optional

module.exports = async function generateNikeAccount(proxy) {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;

  const imapHost = 'imap.gmail.com';
  const imapPort = 993;

  console.log(`👟 Creating Nike account using proxy:\n${JSON.stringify(proxy, null, 2)}`);

  try {
    // Step 1: create Nike account (fake for now)
    const session = await createNikeSession(email, password, proxy);
    console.log(`✅ Session created for: ${email}`);

    // Step 2: Fetch email verification code
    const code = await connectWithImap({
      email,
      password, // Gmail app password
      imapHost,
      imapPort,
      proxy: proxy ? `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}` : null
    });

    if (!code) throw new Error('❌ IMAP code not received');

    console.log(`📬 IMAP code received for ${email}: ${code}`);

    // Step 3: Confirm email with Nike
    const verified = await confirmNikeEmail(session, code);
    if (!verified) throw new Error('❌ Email verification failed');

    console.log(`🧼 Nike account verified and clean: ${email}`);

    return { email, password, proxy };
  } catch (err) {
    console.error(`❌ Failed to generate account ${email}: ${err.message}`);
    throw err;
  }
};
