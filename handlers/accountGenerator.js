const { connectWithImap } = require('../lib/imapClient');
const { confirmNikeEmail, createNikeSession } = require('../lib/nikeApi');
const { generateRandomUser } = require('../lib/nameGen');
const { getGeoNodeProxy } = require('../lib/geonode');

module.exports = async function generateNikeAccount(inputProxy) {
  let proxy = inputProxy;

  console.log('🌐 [Init] Starting account generation...');
  console.log(`📡 Input Proxy Provided: ${!!proxy}`);

  // 🌍 Use input proxy or fallback to GeoNode via helper/env
  if (!proxy) {
    console.log('🌍 No input proxy provided — fetching from getGeoNodeProxy()');
    proxy = await getGeoNodeProxy();
    console.log('📦 getGeoNodeProxy() returned:', proxy);

    if (!proxy || !proxy.username || !proxy.password) {
      console.log('⚠️ getGeoNodeProxy() failed — trying ENV variables');
      const geoUser = process.env.GEONODE_USER;
      const geoPass = process.env.GEONODE_PASS;

      if (!geoUser || !geoPass) {
        console.error('❌ Missing GeoNode credentials in ENV');
        throw new Error('Missing GeoNode credentials in ENV');
      }

      proxy = {
        username: geoUser,
        password: geoPass,
        ip: 'proxy.geonode.io',
        port: 9000
      };
      console.log('✅ Fallback proxy built from ENV:', proxy);
    }
  }

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
    if (!session || !session.challengeId) {
      console.error('❌ Nike session creation failed — no challengeId returned');
      throw new Error('Nike session creation failed');
    }

    console.log(`✅ Nike session created. Challenge ID: ${session.challengeId}`);
    console.log(`📬 Waiting for IMAP code to inbox: ${email}`);

    const code = await connectWithImap({
      email,
      password,
      imapHost,
      imapPort,
      proxy: proxyString
    });

    if (!code) {
      console.error('❌ IMAP verification code not received for:', email);
      throw new Error('IMAP code fetch failed');
    }

    console.log(`📬 IMAP code received: ${code}`);
    console.log(`🔐 Verifying email with Nike...`);

    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) {
      console.error('❌ Nike email verification failed for:', email);
      throw new Error('Email verification failed');
    }

    console.log(`🧼 Account fully created & verified ✅ ${email}`);

    return { email, password, firstName, lastName, proxy };
  } catch (err) {
    console.error(`❌ Account generation failed: ${err.message}`);
    throw err;
  }
};
