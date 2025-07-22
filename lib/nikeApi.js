require('dotenv').config();
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

function parseProxy(proxyString) {
  if (!proxyString || !proxyString.includes('@')) return null;

  const clean = proxyString.replace('http://', '');
  const [auth, hostport] = clean.split('@');
  const [username, password] = auth.split(':');
  const [host, port] = hostport.split(':');

  return {
    host,
    port,
    username,
    password,
    formatted: `http://${username}:${password}@${host}:${port}`,
    agent: new HttpsProxyAgent(`http://${username}:${password}@${host}:${port}`)
  };
}

const getSpoofHeaders = () => ({
  'User-Agent': 'Nike/93 (iPhone; iOS 16.4; Scale/3.00)',
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
  'x-newrelic-id': 'UAQDVF5UChAHUlVRAAYPUA==',
  'x-nike-visitid': `${Date.now()}`
});

async function createNikeAccountViaApi(email, password, proxyString) {
  const proxy = parseProxy(proxyString);
  const agent = proxy?.agent;

  const payload = {
    email,
    password,
    firstName: 'Jordan',
    lastName: 'Smith',
    country: 'GB',
    locale: 'en_GB',
    receiveEmail: true
  };

  try {
    const res = await axios.post(
      'https://api.nike.com/identity/user/create',
      payload,
      {
        headers: getSpoofHeaders(),
        httpsAgent: agent,
        timeout: 15000
      }
    );
    return res.data;
  } catch (err) {
    console.error('❌ Nike API error:', err.response?.status || err.message);
    return null;
  }
}

module.exports = { createNikeAccountViaApi };
