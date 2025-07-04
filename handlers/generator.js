// lib/generator.js

const { getIMAPCode } = require('./imapClient'); // Adjust if file name differs
const { confirmNikeEmail, createNikeSession } = require('./nikeApi'); // If using real endpoints
const { generateRandomUser } = require('./nameGen'); // Optional: swap if you have name generator

module.exports = async function generateNikeAccount(proxy) {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;

  console.log(`👟 Creating Nike account using proxy:\n${JSON.stringify(proxy, null, 2)}`);
  
  try {
    // === Step 1: Create the Nike account session ===
    const session = await createNikeSession(email, password, proxy); // optional
    console.log(`✅ Session created for: ${email}`);

    // === Step 2: Wait for IMAP code ===
    const code = await getIMAPCode(email);
    if (!code) throw new Error('❌ IMAP code not received for verification');

    console.log(`📬 IMAP code received for ${email}: ${code}`);

    // === Step 3: Confirm email with Nike ===
    const verified = await confirmNikeEmail(session, code);
    if (!verified) throw new Error('❌ Email verification failed');

    console.log(`🧼 Nike account verified and clean: ${email}`);

    return { email, password, proxy };
  } catch (err) {
    console.error(`❌ Failed to generate account ${email}: ${err.message}`);
    throw err;
  }
};
