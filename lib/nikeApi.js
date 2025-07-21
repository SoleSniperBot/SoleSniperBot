const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');

function getSpoofedHeaders() {
  return {
    'user-agent': 'Nike/97 (iPhone; iOS 15.6; Scale/3.00)',
    'content-type': 'application/json',
    'accept': 'application/json',
    'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
    'x-newrelic-id': 'VQMGUF5SGwEGVVlbBAcBVw==',
    'x-platform': 'ios',
    'x-app-id': 'com.nike.commerce.snkrs',
    'x-app-version': '22.16.1',
    'x-trace-id': Math.random().toString(36).substring(2, 15),
    'x-requested-with': 'com.nike.commerce.snkrs',
    'x-csrf-token': '',
    'accept-language': 'en-GB',
  };
}

async function createNikeAccountViaApi({ email, password, firstName, lastName, proxy }) {
  const payload = {
    email,
    password,
    firstName,
    lastName,
    account: {
      country: 'GB',
      locale: 'en-GB',
      receiveEmail: true
    }
  };

  const headers = getSpoofedHeaders();

  const httpsAgent = new HttpsProxyAgent({
    proxy,
    keepAlive: true,
    rejectUnauthorized: false
  });

  try {
    const res = await axios.post(
      'https://api.nike.com/identity/user/create',
      payload,
      { httpsAgent, headers, timeout: 15000 }
    );

    if (res.status === 200 && res.data && res.data.id) {
      return {
        success: true,
        id: res.data.id,
        message: 'Account created successfully'
      };
    } else {
      return {
        success: false,
        error: 'Unexpected response structure',
        status: res.status,
        data: res.data
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err.response?.status || err.code || err.message
    };
  }
}

module.exports = {
  createNikeAccountViaApi
};
