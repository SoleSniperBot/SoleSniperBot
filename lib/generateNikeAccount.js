const { createNikeSession, confirmNikeEmail } = require('./snkrsApi');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { getNextEmail, markEmailUsed } = require('./emailManager');
const imap = require('./imap');

module.exports = async function generateNikeAccount(user = 'autobot') {
  console.log('👟 [NikeGen] Starting SNKRS account creation...');

  const proxy = await getLockedProxy();
  if (!proxy?.host || !proxy?.port) throw new Error('No valid proxy available');

  const proxyString = `${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`;
  const email = await getNextEmail();
  const password = 'Sole1234!';
  const firstName = 'Mark';
  const lastName = 'Phillips';

  try {
    const session = await createNikeSession(email, password, proxyString, firstName, lastName);
    if (!session?.challengeId) throw new Error('Nike session creation failed');

    console.log(`📨 Waiting for Nike 2FA code for ${email}`);
    const code = await imap.getNikeCode(email);
    if (!code) throw new Error('2FA code not received');

    const confirmed = await confirmNikeEmail(session.challengeId, code, proxyString);
    if (!confirmed) throw new Error('Email confirmation failed');

    console.log(`✅ [NikeGen] Account created & confirmed: ${email}`);
    await markEmailUsed(email);

    return {
      email,
      password,
      proxy,
      sessionToken: session.accessToken
    };
  } catch (err) {
    console.error('❌ [NikeGen Error]', err.message);
    return null;
  } finally {
    await releaseLockedProxy(proxy);
  }
};
