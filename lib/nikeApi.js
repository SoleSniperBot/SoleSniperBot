// lib/nikeApi.js
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

async function confirmNikeEmail(sessionToken, code, proxy) {
  const agent = proxy
    ? new HttpsProxyAgent(`http://${proxy}`)
    : undefined;

  try {
    const res = await axios.post(
      'https://unite.nike.com/email/verify',
      {
        code,
        challenge: sessionToken
      },
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

    if (res.status === 200 && res.data && res.data.status === 'SUCCESS') {
      console.log('✅ Email confirmed successfully.');
      return true;
    } else {
      console.warn('⚠️ Unexpected response from Nike:', res.data);
      return false;
    }
  } catch (err) {
    console.error('❌ Email confirmation failed:', err.message);
    return false;
  }
}
