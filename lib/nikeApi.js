const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');
const { createWithBrowser } = require('./browserAccountCreator');

const headers = {
  'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
  'content-type': 'application/json',
  accept: 'application/json',
};

async function createNikeAccount(email, password, proxy) {
  const [ip, port, username, pass] = proxy.replace('http://', '').split(/[:@]/);
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
      console.log(`✅ [Nike API] Created: ${email}`);
      return { success: true };
    } else {
      throw new Error(`Unexpected response: ${response.status}`);
    }
  } catch (err) {
    console.warn(`⚠️ Nike API failed (401): ${err.message}`);
    console.log('🖋️ Falling back to browser automation...');

    try {
      const browserSuccess = await createWithBrowser(email, password, proxy);
      if (browserSuccess) {
        return { success: true };
      } else {
        throw new Error('Browser fallback also failed.');
      }
    } catch (browserErr) {
      return { success: false, error: browserErr.message };
    }
  }
}

module.exports = {
  createNikeAccount,
};
