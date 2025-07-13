const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');
const { createNikeAccountWithBrowser } = require('./browserAccountCreator');

const headers = {
  'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
  'content-type': 'application/json',
  accept: 'application/json',
};

/**
 * Attempts to create a Nike account via API, and falls back to Puppeteer if blocked.
 */
async function createNikeAccount(email, password, proxy) {
  const [ip, port, username, pass] = proxy.replace('http://', '').split(/[:@]/);
  const safeProxy = `http://****:****@${ip}:${port}`;
  const proxyUrl = `http://${username}:${pass}@${ip}:${port}`;

  const httpsAgent = new HttpsProxyAgent({
    proxy: proxyUrl,
    keepAlive: true,
  });

  try {
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
      }
    );

    if (response.status === 200 || response.data?.id) {
      console.log(`✅ [Nike API] Account created: ${email}`);
      return { success: true };
    } else {
      throw new Error(`Unexpected response code: ${response.status}`);
    }

  } catch (err) {
    console.warn(`⚠️ API method failed: ${err.message}`);
    console.log(`🖥️ Fallback to browser for ${email} via proxy ${safeProxy}`);

    try {
      const browserSuccess = await createNikeAccountWithBrowser(email, password, proxy);
      if (browserSuccess) {
        return { success: true };
      } else {
        throw new Error('Browser fallback failed');
      }
    } catch (browserErr) {
      console.error(`❌ Full failure for ${email}: ${browserErr.message}`);
      return { success: false, error: browserErr.message };
    }
  }
}

module.exports = {
  createNikeAccount,
};
