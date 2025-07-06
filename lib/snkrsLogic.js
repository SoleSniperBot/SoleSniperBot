const axios = require('axios');
const { performPuppeteerCheckout } = require('./puppeteerCheckout');

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

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🧪 Attempt ${attempt} to checkout via Nike API...`);

      const response = await axios.post('https://api.nike.com/checkout', checkoutPayload, {
        proxy: proxyConfig,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SoleSniperBot/1.0)',
        },
      });

      if (response.status === 200) {
        console.log(`✅ SNKRS API Checkout succeeded on attempt ${attempt}`);
        return true;
      } else {
        throw new Error(`Checkout failed with status ${response.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ Attempt ${attempt} failed: ${err.message}`);
      if (attempt < 3) {
        await new Promise(res => setTimeout(res, 2000)); // Wait 2 sec before retry
      }
    }
  }

  // 🧠 Fallback to Puppeteer
  console.log('🔁 API checkout failed 3 times — falling back to browser mode...');
  return await performPuppeteerCheckout({ sku, proxy, profile, userId });
}

module.exports = {
  performSnkrsCheckout,
};
