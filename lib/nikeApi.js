const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');
const { createNikeAccountWithBrowser } = require('./browserAccountCreator');

const headers = {
  'user-agent': 'Nike/96 (iPhone; iOS 17.3; Scale/3.00)',
  'x-nike-ua': 'NikeMobileApp/96.2 Android/14.0',
  'content-type': 'application/json',
  'accept': 'application/json',
  'appid': 'com.nike.commerce.nikedotcom.web',
  'referer': 'https://unite.nike.com',
  'origin': 'https://unite.nike.com'
};

async function createNikeAccount(email, password, proxy) {
  const [ip, port, username, pass] = proxy.replace('http://', '').split(/[:@]/);
  const safeProxy = `http://****:****@${ip}:${port}`;
  const proxyUrl = `http://${username}:${pass}@${ip}:${port}`;

  const httpsAgent = new HttpsProxyAgent({
    proxy: proxyUrl,
    keepAlive: true,
  });

  console.log(`🌐 [NikeAPI] Attempt via proxy ${safeProxy}`);

  try {
    const response = await axios.post(
      'https://unite.nike.com/identity/user/create',
      {
        email,
        password,
        firstName: 'Mark',
        lastName: 'Phillips',
        country: 'GB',
        locale: 'en_GB',
        receiveEmail: true
      },
      {
        headers,
        httpsAgent,
        timeout: 15000
      }
    );

    if (response.status === 200 && response.data?.id) {
      console.log(`✅ [Nike API] Account created: ${email}`);
      return { success: true };
    }

    throw new Error('Unexpected response from Nike');
  } catch (apiError) {
    console.warn(`⚠️ [Nike API] Failed: ${apiError.message}`);
    console.log(`🖥️ Fallback to browser method for ${email} via ${safeProxy}`);

    try {
      const browserResult = await createNikeAccountWithBrowser(email, password, proxy);
      if (browserResult) {
        console.log(`✅ [Browser] Account created: ${email}`);
        return { success: true };
      } else {
        throw new Error('Browser fallback failed');
      }
    } catch (fallbackErr) {
      console.error(`❌ Total failure for ${email}: ${fallbackErr.message}`);
      return { success: false, error: fallbackErr.message };
    }
  }
}

module.exports = { createNikeAccount };
