const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

/**
 * Attempt Nike login using email/password and proxy
 * @param {Object} account - { email, password, proxy }
 * @returns {Promise<string>} Status message
 */
async function loginNike(account) {
  const { email, password, proxy } = account;
  const agent = proxy ? new HttpsProxyAgent(`socks5://${proxy}`) : undefined;

  const payload = {
    login: email,
    password: password
  };

  try {
    const res = await axios.post('https://unite.nike.com/login', payload, {
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

    const response = res.data;

    if (response && response.status === 200 && response.access_token) {
      return '✅ Active';
    }

    if (response && response.error === 'access_denied') {
      return '❌ Banned or invalid';
    }

    return '🛑 Unknown login state';
  } catch (err) {
    if (err.response?.data?.error === 'invalid_grant') {
      return '❌ Invalid login';
    }

    if (err.response?.data?.error === 'verification_required') {
      return '🛑 Needs 2FA';
    }

    return `⚠️ Error: ${err.message}`;
  }
}

module.exports = loginNike;
