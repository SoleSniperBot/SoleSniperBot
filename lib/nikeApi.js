const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');
const { createNikeAccountWithBrowser } = require('../utils/browserAccountCreator');

const headers = {
  'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
  'content-type': 'application/json',
  accept: 'application/json',
};

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
      console.log(`â [Nike API] Account created: ${email}`);
      return { success: true };
    } else {
      throw new Error(`Unexpected response code: ${response.status}`);
    }

  } catch (err) {
    console.warn(`â ï¸ API method failed: ${err.message}`);
    console.log(`ð¥ï¸ Fallback to browser for ${email} via proxy ${safeProxy}`);

    try {
      const browserSuccess = await createNikeAccountWithBrowser(email, password, proxy);
      if (browserSuccess) {
        return { success: true };
      } else {
        throw new Error('Browser fallback failed');
      }
    } catch (browserErr) {
      console.error(`â Full failure for ${email}: ${browserErr.message}`);
      return { success: false, error: browserErr.message };
    }
  }
}

module.exports = {
  createNikeAccount,
};
