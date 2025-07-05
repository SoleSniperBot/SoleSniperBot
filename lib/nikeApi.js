const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

// ✅ Create Nike account
async function createNikeSession(email, password, proxy, firstName = 'John', lastName = 'Doe') {
  const agent = proxy ? new HttpsProxyAgent(`socks5://${proxy}`) : undefined;

  const payload = {
    account: {
      emailAddress: email,
      passwordSettings: {
        password,
        passwordConfirm: password
      },
      firstName,
      lastName,
      registrationSiteId: 'nikedotcom',
      receiveEmail: true
    },
    skipFidoRegistration: true
  };

  try {
    const res = await axios.post('https://unite.nike.com/access/users/v1', payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Nike/22.9 Android/10 (Pixel 5)',
        'Accept': 'application/json',
        'appid': 'com.nike.snkrs',
        'x-nike-ux-id': 'com.nike.commerce.snkrs.web'
      },
      httpsAgent: agent,
      timeout: 10000
    });

    if (res.status === 200 && res.data?.challengeId) {
      console.log('✅ Nike session created with challengeId:', res.data.challengeId);
      return {
        challengeId: res.data.challengeId,
        accessToken: res.data.accessToken || null
      };
    } else {
      console.warn('⚠️ Unexpected Nike response:', res.data);
      return null;
    }
  } catch (err) {
    if (err.response) {
      console.error('❌ Nike account creation failed:', err.response.data);
    } else {
      console.error('❌ Nike account creation error:', err.message);
    }
    return null;
  }
}

// ✅ Confirm Nike email with code
async function confirmNikeEmail(sessionToken, code, proxy) {
  const agent = proxy ? new HttpsProxyAgent(`socks5://${proxy}`) : undefined;

  try {
    const res = await axios.post(
      'https://unite.nike.com/email/verify',
      { code, challenge: sessionToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Nike/22.9 Android/10 (Pixel 5)',
          'Accept': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        httpsAgent: agent,
        timeout: 10000
      }
    );

    if (res.status === 200 && res.data?.status === 'SUCCESS') {
      console.log('✅ Email confirmed successfully.');
      return true;
    } else {
      console.warn('⚠️ Email verify response:', res.data);
      return false;
    }
  } catch (err) {
    if (err.response) {
      console.error('❌ Email confirmation failed:', err.response.data);
    } else {
      console.error('❌ Email confirmation error:', err.message);
    }
    return false;
  }
}

module.exports = {
  createNikeSession,
  confirmNikeEmail
};
