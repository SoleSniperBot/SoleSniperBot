const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { createNikeAccountWithBrowser } = require('./browserAccountCreator');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log('👟 [NikeGen] Starting generation for:', user);

  let proxy;
  try {
    proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) {
      console.error('❌ Proxy is invalid or empty');
      return;
    }
  } catch (err) {
    console.error('❌ Failed to get proxy:', err.message);
    return;
  }

  try {
    const result = await createNikeAccountWithBrowser(proxy.formatted);
    console.log(`✅ Account created: ${result.email}`);
  } catch (err) {
    console.error('❌ Account creation failed:', err.message);
  } finally {
    releaseLockedProxy(proxy);
  }
};
