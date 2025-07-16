const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');
const { createNikeAccountWithBrowser } = require('./browserAccountCreator');

const headers = {
  'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
  'content-type': 'application/json',
  accept: 'application/json',
};

async function createNikeAccount(email, password, proxy) {
  try {
    const [user, pass, host, port] = proxy.replace(/^http:\/\//, '').split(/[:@]/);
    const proxyUrl = `http://${user}:${pass}@${host}:${port}`;
    const safeProxyLog = `${host}:${port}`;

    const httpsAgent = new HttpsProxyAgent({
      proxy: proxyUrl,
      keepAlive: true,
    });

    console.log(`🌐 Connecting to Nike API via proxy ${safeProxyLog}...`);

    const response = await axios.post(
      'https://api.nike.com/identity/user/create',
      {
        email,
        password,
        firstName: 'Mark',
        lastName: 'Phillips',
        country: 'GB',
        locale: 'en_GB',
        receiveEmail: true,
      },
      {
        headers,
        httpsAgent,
        timeout: 10000,
      }
    );

    if (response.status === 200 || response.data?.id) {
      console.log(`✅ [Nike API] Created: ${email}`);
      return { success: true };
    }

    throw new Error(`Unexpected API status: ${response.status}`);
  } catch (err) {
    console.warn(`⚠️ API failed: ${err.message}`);
    console.log(`🖥️ Trying browser fallback...`);

    try {
      const success = await createNikeAccountWithBrowser(email, password, proxy);
      if (success) {
        console.log(`✅ [Browser] Created via fallback: ${email}`);
        return { success: true };
      } else {
        throw new Error('Browser fallback failed');
      }
    } catch (e) {
      console.error(`❌ Total failure for ${email}: ${e.message}`);
      return { success: false, error: e.message };
    }
  }
}

module.exports = { createNikeAccount };
