module.exports = async function generateNikeAccount(inputProxy) {
  let proxy = inputProxy;

  console.log('🌐 [Init] Starting account generation...');
  console.log(`📡 Input Proxy Provided: ${!!proxy}`);

  // 🔁 Fallback to manager if no input
  if (!proxy) {
    console.log('🌍 No input proxy provided — fetching from proxyManager...');
    proxy = await getLockedProxy('autogen');
    if (!proxy) {
      console.error('❌ No proxy returned from proxyManager');
      throw new Error('Proxy acquisition failed');
    }
    console.log('📦 Locked proxy acquired:', proxy);
  }

  // ✅ Ensure all fields exist
  if (!proxy.ip || !proxy.port || !proxy.username || !proxy.password) {
    console.error('❌ Invalid proxy structure:', proxy);
    throw new Error('Proxy fields missing or incomplete');
  }

  const proxyString = `${proxy.ip}:${proxy.port}:${proxy.username}:${proxy.password}`;
  console.log(`🌍 Using Proxy: ${proxyString}`);

  // 🧠 Create user info
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;
  const { firstName, lastName } = generateRandomUser();

  console.log(`👟 Creating Nike account for: ${firstName} ${lastName} <${email}>`);

  try {
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);
    if (!session || !session.challengeId) {
      console.error('❌ Nike session creation failed — no challengeId returned');
      throw new Error('Nike session creation failed');
    }

    console.log(`✅ Nike session created. Challenge ID: ${session.challengeId}`);
    console.log(`📬 Waiting for 2FA code to inbox: ${email}`);

    const code = await fetchNike2FA(email, password, proxyString);
    if (!code) {
      console.error('❌ Gmail 2FA code not received for:', email);
      throw new Error('2FA code fetch failed');
    }

    console.log(`📬 Code received: ${code}`);
    console.log(`🔐 Verifying email with Nike...`);

    const verified = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!verified) {
      console.error('❌ Nike email verification failed for:', email);
      throw new Error('Email verification failed');
    }

    console.log(`🧼 Account fully created & verified ✅ ${email}`);

    const account = {
      email,
      password,
      firstName,
      lastName,
      proxy: proxyString,
      createdAt: new Date().toISOString()
    };

    const existing = JSON.parse(fs.readFileSync(accountsPath));
    existing.push(account);
    fs.writeFileSync(accountsPath, JSON.stringify(existing, null, 2));

    return account;

  } catch (err) {
    console.error(`❌ Account generation failed: ${err.message}`);
    throw err;
  }
};
