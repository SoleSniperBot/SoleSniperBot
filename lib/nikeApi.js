const axios = require('axios');
const uuid = require('uuid');

async function createNikeSession(email, password, proxy) {
  const deviceId = uuid.v4();
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Nike/10500 CFNetwork/1390.0.1 Darwin/22.0.0',
    'Accept-Language': 'en-GB',
    'x-nike-uuid': deviceId,
    'x-newrelic-id': 'UAQDVF5UChAHUlNTBwg=', // fake app performance token
  };

  const data = {
    "firstName": "Sole",
    "lastName": "Sniper",
    "email": email,
    "password": password,
    "country": "GB",
    "locale": "en_GB",
    "registrationSiteId": "snkrs_gb",
    "receiveEmail": true,
    "receiveSms": false,
    "mobileNumber": "",
    "dateOfBirth": "1998-04-15"
  };

  const agent = proxy ? {
    proxy: {
      host: proxy.ip || proxy.host,
      port: parseInt(proxy.port),
      auth: proxy.username && proxy.password ? {
        username: proxy.username,
        password: proxy.password
      } : undefined
    }
  } : {};

  const res = await axios.post(
    'https://unite.nike.com/signup', // Nike's (public-facing) account registration endpoint
    data,
    {
      headers,
      timeout: 10000,
      ...agent
    }
  );

  if (res.status !== 200 || !res.data || !res.data.id) {
    throw new Error(`Nike signup failed: ${res.status}`);
  }

  return {
    sessionId: res.data.id,
    email,
    password
  };
}

async function confirmNikeEmail(session, code) {
  // This is a simulated confirmation endpoint for example purposes
  // You must reverse Nike's actual endpoint if needed
  console.log(`📨 Verifying email ${session.email} with code: ${code}`);

  // You could also simulate or mock success here
  return true; // Treat as confirmed
}

module.exports = {
  createNikeSession,
  confirmNikeEmail
};
