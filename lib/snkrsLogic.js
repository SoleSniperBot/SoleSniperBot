const axios = require('axios');
const { performPuppeteerCheckout } = require('./puppeteerCheckout');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function performSnkrsCheckout({ sku, proxy, profile, userId }) {
  const [ip, port, user, pass] = proxy.split(':');
  const proxyConfig = {
    host: ip,
    port: parseInt(port),
    auth: user && pass ? { username: user, password: pass } : undefined,
    protocol: 'http',
  };

  const checkoutPayload = {
    sku,
    profile,
    userId,
  };

  const maxRetries = 3;
  let bannedDetected = false;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🧪 [API Attempt ${attempt}] Checkout via proxy ${ip}`);

      const response = await axios.post('https://api.nike.com/checkout', checkoutPayload, {
        proxy: proxyConfig,
        timeout: 15000,
        headers: {
          'User-Agent': 'Nike/93 CFNetwork/1408.0.4 Darwin/22.5.0', // mimic SNKRS app
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 && response.data && response.data.success) {
        console.log('✅ SNKRS API Checkout Success');
        return true;
      } else if (response.data && response.data.error === 'banned') {
        console.warn(`🚫 Proxy ${ip} appears banned`);
        bannedDetected = true;
        break;
      } else {
        throw new Error(`Nike API responded with ${response.status}: ${JSON.stringify(response.data)}`);
      }

    } catch (err) {
      console.warn(`❌ API Attempt ${attempt} failed: ${err.message}`);

      if (
        err.code === 'ECONNABORTED' ||
        err.message.includes('timeout') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('Proxy connection timed out')
      ) {
        console.warn('⚠️ Network timeout — will retry...');
      }

      if (attempt < maxRetries) await delay(3500);
    }
  }

  if (bannedDetected) {
    throw new Error('🛑 Proxy flagged/banned by Nike — rotate and retry.');
  }

  console.log('🧪 Attempting Puppeteer fallback (full browser checkout)...');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await performPuppeteerCheckout({ sku, proxy, profile });
      if (result === true) {
        console.log('✅ Puppeteer Checkout Success');
        return true;
      } else {
        throw new Error('Fallback checkout failed silently');
      }
    } catch (err) {
      console.warn(`❌ Puppeteer Attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) await delay(4000);
    }
  }

  throw new Error('❌ All checkout attempts failed (API + fallback)');
}

module.exports = {
  performSnkrsCheckout,
};
