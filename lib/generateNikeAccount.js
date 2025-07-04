const axios = require('axios');
const { connectWithImap } = require('../lib/imapClient');
const { confirmNikeEmail, createNikeSession } = require('../lib/nikeApi');
const { generateRandomUser } = require('../lib/nameGen');

module.exports = async function generateNikeAccount() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;
  const imapHost = 'imap.gmail.com';
  const imapPort = 993;

  // ✅ Fetch proxy from GeoNode
  let proxyString = null;
  try {
    const res = await axios.get('https://proxylist.geonode.com/api/proxy-list', {
      params: {
        limit: 1,
        page: 1,
        sort_by: 'lastChecked',
        protocol: 'socks5',
        apiKey: process.env.GEONODE_API_KEY
      }
    });

    const proxy = res.data.data[0];
    proxyString = `${proxy.ip}:${proxy.port}`;
    console.log(`🌍 Using Proxy: ${proxyString}`);
  } catch (err) {
    console.error('❌ Failed to fetch proxy from GeoNode:', err.message);
  }

  // 🎯 Realistic name
  const { firstName, lastName } = generateRandomUser();
  console.log(`👟 Creating Nike account for: ${firstName} ${lastName} <${email}>`);

  try {
    // Step 1: Create Nike account session
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);
    if (!session || !session.challengeId) throw new Error('❌ Nike session creation failed');
    console.log(`✅ Session created for ${email}`);

    // Step 2: Fetch IMAP 2FA code
    const code = await connectWithImap({
      email,
      password,
      imapHost,
      imapPort,
      proxy: proxyString
    });

    if (!code) throw new Error('❌ IMAP verification code not received');
    console.log(`📬 IMAP code received: ${code}`);

    // Step 3: Confirm email
    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) throw new Error('❌ Nike email verification failed');

    console.log(`🧼 Nike account verified: ${email}`);
    return { email, password, firstName, lastName, proxy: proxyString };

  } catch (err) {
    console.error(`❌ Account generation failed: ${err.message}`);
    throw err;
  }
};
