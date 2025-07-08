const axios = require('axios');
const { HttpProxyAgent, HttpsProxyAgent } = require('hpagent');
const { v4: uuid } = require('uuid');

// === Create Nike Session ===
async function createNikeSession(email, password, proxyString, firstName = 'John', lastName = 'Doe') {
  try {
    const [ip, port, username, passwordProxy] = proxyString.split(':');
    const formattedProxy = `http://${username}:${passwordProxy}@${ip}:${port}`;

    const httpAgent = new HttpProxyAgent({ proxy: formattedProxy });
    const httpsAgent = new HttpsProxyAgent({ proxy: formattedProxy });

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

    const headers = {
      'User-Agent': 'Nike/2.2024.07.20 (iPhone; iOS 17.5; Scale/3.00)',
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'x-nike-visitid': uuid(),
      'x-newrelic-id': 'UAQDVV5SCBAGUlNTBQ==',
      'x-platform': 'ios',
      'x-app-version': '2.2024.07.20',
      'x-device-id': uuid()
    };

    const res = await axios.post('https://unite.nike.com/access/users/v1', payload, {
      headers,
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
      console.error('❌ Nike account creation failed:', {
        status: err.response.status,
        data: err.response.data
      });
    } else {
      console.error('❌ Network or setup error:', err.message);
    }
    return null;
  }
}

// === Confirm Email with Code ===
async function confirmNikeEmail(sessionToken, code, proxyString) {
  try {
    const [ip, port, username, passwordProxy] = proxyString.split(':');
    const formattedProxy = `http://${username}:${passwordProxy}@${ip}:${port}`;

    const httpAgent = new HttpProxyAgent({ proxy: formattedProxy });
    const httpsAgent = new HttpsProxyAgent({ proxy: formattedProxy });

    const headers = {
      'User-Agent': 'Nike/2.2024.07.20 (iPhone; iOS 17.5; Scale/3.00)',
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
      'x-platform': 'ios',
      'x-app-version': '2.2024.07.20',
      'x-device-id': uuid()
    };

    const res = await axios.post(
      'https://unite.nike.com/email/verify',
      { code, challenge: sessionToken },
      {
        headers,
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
      console.error('❌ Email confirmation failed:', {
        status: err.response.status,
        data: err.response.data
      });
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
