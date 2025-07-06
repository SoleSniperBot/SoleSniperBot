// lib/snkrsLogic.js
const axios = require('axios');
const { performPuppeteerCheckout } = require('./puppeteerCheckout');

async function performSnkrsCheckout({ sku, proxy, profile, userId }) {
  // Parse proxy parts for axios
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

  try {
    console.log(`🚀 Attempting API checkout for ${sku}`);
    const response = await axios.post('https://api.nike.com/checkout', checkoutPayload, {
      proxy: proxyConfig,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SoleSniperBot/1.0)',
      },
    });

    if (response.status === 200) {
      console.log('✅ API checkout success');
      return true;
    } else {
      throw new Error(`Checkout failed with status ${response.status}`);
    }

  } catch (err) {
    console.warn('⚠️ API checkout failed:', err.message);
    console.log('🧪 Switching to Puppeteer fallback...');
    // Use Puppeteer fallback
    return await performPuppeteerCheckout({ sku, proxy, profile });
  }
}

module.exports = {
  performSnkrsCheckout,
};
