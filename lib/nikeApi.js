const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

// === Create Nike Session ===
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
      timeout: 15000
    });

    const data = res.data;

    if (res.status === 200 && data.challengeId) {
      console.log(`✅ Nike session created: ${data.challengeId}`);
      return {
        challengeId: data.challengeId,
        accessToken: data.accessToken || null
      };
    }

    console.warn('⚠️ Unexpected Nike account creation response:', data);
    return null;
  } catch (err) {
    if (err.response) {
      console.error('❌ Nike account creation failed:', err.response.data);
    } else {
      console.error('❌ Nike account creation error:', err.message);
    }
    return null;
  }
}

// === Confirm Email with Code ===
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

    const data = res.data;

    if (res.status === 200 && data.status === 'SUCCESS') {
      console.log('✅ Email confirmed successfully.');
      return true;
    }

    console.warn('⚠️ Email verification failed response:', data);
    return false;
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
