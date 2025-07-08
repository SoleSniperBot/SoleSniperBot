const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');

function buildNikeHeaders(token = null) {
  return {
    'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)', // SNKRS iOS UA
    'accept': 'application/json',
    'content-type': 'application/json',
    'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

function buildProxyAgent(proxyString) {
  return new HttpsProxyAgent({
    proxy: proxyString,
    keepAlive: true,
  });
}

async function createNikeSession(email, password, proxyString) {
  try {
    const httpsAgent = buildProxyAgent(proxyString);
    const headers = buildNikeHeaders();

    const payload = {
      email,
      password,
      firstName: 'Mark',
      lastName: 'Phillips',
      country: 'GB',
      locale: 'en_GB',
      receiveEmail: true,
      registrationSiteId: 'nikecom', // optional but helpful
      skipFidoRegistration: true,   // skip passkey prompt
    };

    const res = await axios.post(
      'https://api.nike.com/identity/user/create',
      payload,
      {
        headers,
        httpsAgent,
        timeout: 15000,
      }
    );

    if (res.status === 200 || res.status === 201) {
      console.log('✅ Nike account created:', res.data);
      return {
        accessToken: res.data.accessToken || null,
        userId: res.data.id || null,
      };
    }

    console.warn('⚠️ Unexpected response:', res.data);
    return null;
  } catch (error) {
    console.error('❌ Nike account creation error:', error.message);
    if (error.response) {
      console.error('Nike API response:', error.response.data);
    }
    return null;
  }
}

async function confirmNikeEmail(sessionToken, code, proxyString) {
  try {
    const httpsAgent = buildProxyAgent(proxyString);
    const headers = buildNikeHeaders(sessionToken);

    const res = await axios.post(
      'https://unite.nike.com/email/verify',
      { code, challenge: sessionToken },
      {
        headers,
        httpsAgent,
        timeout: 10000,
      }
    );

    if (res.data?.status === 'SUCCESS') {
      console.log('✅ Email verified.');
      return true;
    }

    console.warn('⚠️ Email verification failed:', res.data);
    return false;
  } catch (err) {
    console.error('❌ Email confirmation error:', err.message);
    if (err.response) {
      console.error('Response:', err.response.data);
    }
    return false;
  }
}

module.exports = {
  createNikeSession,
  confirmNikeEmail,
};
