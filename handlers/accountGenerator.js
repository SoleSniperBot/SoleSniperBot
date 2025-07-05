const { connectWithImap } = require('../lib/imapClient');
const { confirmNikeEmail, createNikeSession } = require('../lib/nikeApi');
const { generateRandomUser } = require('../lib/nameGen');
const { getGeoNodeProxy } = require('../lib/geonode');

module.exports = async function generateNikeAccount(inputProxy) {
  let proxy = inputProxy;

  // 🌍 If no proxy provided, fallback to GeoNode from ENV or helper
  if (!proxy) {
    proxy = await getGeoNodeProxy();

    if (!proxy || !proxy.username || !proxy.password) {
      const geoUser = process.env.GEONODE_USER;
      const geoPass = process.env.GEONODE_PASS;

      if (!geoUser || !geoPass) {
        console.error('❌ Missing GeoNode credentials');
        throw new Error('Missing GeoNode credentials');
      }

      proxy = {
        username: geoUser, // e.g. "geonode_fUy6U0SwyY-type-residential"
        password: geoPass, // API key (UUID format)
        ip: 'proxy.geonode.io',
        port: 9000 // Rotating residential port
      };
    }
  }

  // 🔐 Build proxy string
  const proxyString = `${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;

  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;
  const imapHost = 'imap.gmail.com';
  const imapPort = 993;
  const { firstName, lastName } = generateRandomUser();

  console.log(`👟 Creating Nike account for: ${firstName} ${lastName} <${email}>`);
  console.log(`🌍 Using Proxy: ${proxyString}`);

  try {
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);
    if (!session || !session.challengeId) throw new Error('❌ Nike session creation failed');

    console.log(`✅ Session created. Waiting for verification code...`);

    const code = await connectWithImap({
      email,
      password,
      imapHost,
      imapPort,
      proxy: proxyString
    });

    if (!code) throw new Error('❌ IMAP verification code not received');
    console.log(`📬 Verification code received: ${code}`);

    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) throw new Error('❌ Nike email verification failed');

    console.log(`🧼 Account verified & created: ${email}`);

    return { email, password, firstName, lastName, proxy };
  } catch (err) {
    console.error(`❌ Account generation failed: ${err.message}`);
    throw err;
  }
};
