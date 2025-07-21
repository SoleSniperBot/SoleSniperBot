const axios = require('axios');
const { HttpsProxyAgent } = require('hpagent');
const { getNike2FACode } = require('./imap');

function getAxiosInstance(proxy) {
  const agent = new HttpsProxyAgent({
    proxy: `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`,
    keepAlive: true
  });

  return axios.create({
    httpsAgent: agent,
    headers: {
      'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
      'accept': 'application/json',
      'content-type': 'application/json',
      'x-newrelic-id': 'VQMGUVZUGwEAXVlbBgc=', // mimic SNKRS app
    },
    timeout: 15000
  });
}

async function createNikeAccount({ email, password, proxy, firstName, lastName }) {
  const client = getAxiosInstance(proxy);
  try {
    const res = await client.post('https://api.nike.com/identity/user/create', {
      email,
      password,
      firstName,
      lastName,
      country: 'GB',
      locale: 'en_GB',
      receiveEmail: true,
      registrationSiteId: 'snkrs_web', // mimic SNKRS UK
    });

    return { success: true, res: res.data };
  } catch (err) {
    console.error('❌ Nike API error:', err.response?.data || err.message);
    return { success: false };
  }
}

async function confirmNikeEmail(email, proxy) {
  try {
    const code = await getNike2FACode(email);
    if (!code) {
      console.warn('⚠️ No 2FA code found');
      return false;
    }

    const client = getAxiosInstance(proxy);
    await client.post('https://unite.nike.com/email/verify', {
      emailAddress: email,
      code: code,
    });

    return true;
  } catch (err) {
    console.error('❌ Email verification failed:', err.message);
    return false;
  }
}

module.exports = { createNikeAccount, confirmNikeEmail };
