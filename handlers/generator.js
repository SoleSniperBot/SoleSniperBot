const { connectWithImap } = require('../lib/imapClient');
const { confirmNikeEmail, createNikeSession } = require('../lib/nikeApi');
const { generateRandomUser } = require('../lib/nameGen');

// 👇 Replace this if using GeoNode shared key/rotation
const defaultGeoNodeProxy = {
  ip: 'gw.geonode.com',
  port: 9000,
  username: process.env.GEONODE_USER,
  password: process.env.GEONODE_PASS
};

module.exports = async function generateNikeAccount(inputProxy) {
  const proxy = inputProxy || defaultGeoNodeProxy;

  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;
  const imapHost = 'imap.gmail.com';
  const imapPort = 993;

  const proxyString = proxy
    ? `${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`
    : null;

  const { firstName, lastName } = generateRandomUser();

  console.log(`👟 Creating Nike account for: ${firstName} ${lastName} <${email}>`);
  console.log(`🌍 Using Proxy: ${proxyString || 'None'}`);

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
