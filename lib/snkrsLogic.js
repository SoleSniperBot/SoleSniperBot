const axios = require('axios');
const { browserCheckout } = require('./snkrsBrowserFallback');

async function performSnkrsCheckout({ sku, proxy, profile, userId }) {
  const [ip, port, user, pass] = proxy.split(':');
  const proxyConfig = {
    host: ip,
    port: parseInt(port),
    auth: user && pass ? { username: user, password: pass } : undefined,
    protocol: 'http'
  };

  const checkoutPayload = {
    sku,
    profile,
    userId,
  };

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🛒 Attempt ${attempt} - SNKRS API Checkout...`);

      const response = await axios.post('https://api.nike.com/checkout', checkoutPayload, {
        proxy: proxyConfig,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SoleSniperBot/1.0)',
        },
      });

      if (response.status === 200) {
        console.log('✅ SNKRS Checkout API succeeded');
        return true;
      } else {
        throw new Error(`❌ API failed with status ${response.status}`);
      }

    } catch (err) {
      console.warn(`⚠️ Attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2000 * attempt)); // Delay increases
      }
    }
  }

  // Final fallback after retries
  console.log('🧪 Switching to browser fallback...');
  const fallbackResult = await browserCheckout(sku, proxy, profile);
  return fallbackResult;
}

module.exports = {
  performSnkrsCheckout,
};
