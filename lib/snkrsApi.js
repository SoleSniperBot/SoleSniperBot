const axios = require('axios');
const { HttpProxyAgent, HttpsProxyAgent } = require('hpagent');

// === Create Nike Session ===
async function createNikeSession(email, password, proxyString, firstName = 'John', lastName = 'Doe') {
  try {
    const [ip, port, username, passwordProxy] = proxyString.split(':');
    const formattedProxy = `http://${username}:${passwordProxy}@${ip}:${port}`;

    const agentConfig = {
      proxy: formattedProxy,
      keepAlive: false,
    };

    const agent = {
      httpAgent: new HttpProxyAgent(agentConfig),
      httpsAgent: new HttpsProxyAgent(agentConfig),
    };

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

    await new Promise(res => setTimeout(res, 1000 + Math.random() * 1000)); // Delay to avoid detection

    const res = await axios.post('https://unite.nike.com/access/users/v1', payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Nike/22.9 Android/10 (Pixel 5)',
        'Accept': 'application/json',
        'appid': 'com.nike.snkrs',
        'x-nike-ux-id': 'com.nike.commerce.snkrs.web'
      },
      timeout: 15000,
      ...agent
    });

    const data = res.data;
    console.log('ð Response Headers:', res.headers);

    if (res.status === 200 && data.challengeId) {
      console.log(`â Nike session created: ${data.challengeId}`);
      return {
        challengeId: data.challengeId,
        accessToken: data.accessToken || null
      };
    }

    console.warn('â ï¸ Unexpected Nike account creation response:', data);
    return null;
  } catch (err) {
    if (err.response) {
      console.error('â Nike account creation failed:', err.response.data);
    } else {
      console.error('â Nike account creation error:', err.message);
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
      keepAlive: false,
    };

    const agent = {
      httpAgent: new HttpProxyAgent(agentConfig),
      httpsAgent: new HttpsProxyAgent(agentConfig),
    };

    await new Promise(res => setTimeout(res, 500 + Math.random() * 1000)); // Delay to avoid detection

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
        ...agent
      }
    );

    const data = res.data;
    console.log('ð Email Confirm Headers:', res.headers);

    if (res.status === 200 && data.status === 'SUCCESS') {
      console.log('â Email confirmed successfully.');
      return true;
    }

    console.warn('â ï¸ Email verification failed response:', data);
    return false;
  } catch (err) {
    if (err.response) {
      console.error('â Email confirmation failed:', err.response.data);
    } else {
      console.error('â Email confirmation error:', err.message);
    }
    return false;
  }
}

module.exports = {
  createNikeSession,
  confirmNikeEmail
};
