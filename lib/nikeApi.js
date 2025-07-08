const axios = require('axios');
const { HttpProxyAgent, HttpsProxyAgent } = require('hpagent');

// === Create Nike Session ===
async function createNikeSession(email, password, proxyString, firstName = 'John', lastName = 'Doe') {
  try {
    const [ip, port, username, passwordProxy] = proxyString.split(':');
    const formattedProxy = `http://${username}:${passwordProxy}@${ip}:${port}`;

    const agentConfig = {
      proxy: formattedProxy,
      keepAlive: false
    };

    const httpAgent = new HttpProxyAgent(agentConfig);
    const httpsAgent = new HttpsProxyAgent(agentConfig);

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

    const res = await axios.post('https://unite.nike.com/access/users/v1', payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Nike/22.9 Android/10 (Pixel 5)',
        'Accept': 'application/json',
        'appid': 'com.nike.snkrs',
        'x-nike-ux-id': 'com.nike.commerce.snkrs.web'
      },
      timeout: 15000,
      httpAgent,
      httpsAgent
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
async function confirmNikeEmail(sessionToken, code, proxyString) {
  try {
    const [ip, port, username, passwordProxy] = proxyString.split(':');
    const formattedProxy = `http://${username}:${passwordProxy}@${ip}:${port}`;

    const agentConfig = {
      proxy: formattedProxy,
      keepAlive: false
    };

    const httpAgent = new HttpProxyAgent(agentConfig);
    const httpsAgent = new HttpsProxyAgent(agentConfig);

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
        timeout: 10000,
        httpAgent,
        httpsAgent
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
