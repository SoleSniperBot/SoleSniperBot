// snkrsLogic.js
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

  const payload = {
    sku,
    profile,
    userId,
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🚀 Attempt ${attempt} - SNKRS checkout via API...`);
      const response = await axios.post('https://api.nike.com/checkout', payload, {
        proxy: proxyConfig,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SoleSniperBot/1.0)',
        },
      });

      if (response.status === 200) {
        console.log(`✅ Checkout succeeded on attempt ${attempt}`);
        return true;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ Attempt ${attempt} failed: ${err.message}`);
      if (attempt === 3) {
        console.log('🔁 Switching to Puppeteer fallback...');
        return await performPuppeteerCheckout({ sku, proxy, profile, userId });
      }
      await new Promise(r => setTimeout(r, 1500)); // delay between retries
    }
  }
}

module.exports = {
  performSnkrsCheckout,
};
