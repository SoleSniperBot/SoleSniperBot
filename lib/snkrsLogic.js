const axios = require('axios');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const { puppeteerCheckout } = require('./puppeteerCheckout');

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function snkrsCheckout({ sku, profile, userId }) {
  const proxy = await getLockedProxy(userId);
  if (!proxy) throw new Error('No proxy available.');

  const [host, port, username, password] = proxy.split(':');
  const proxyUrl = `http://${username}:${password}@${host}:${port}`;

  const axiosInstance = axios.create({
    proxy: {
      protocol: 'http',
      host,
      port: parseInt(port),
      auth: { username, password }
    },
    timeout: 15000,
    headers: {
      'User-Agent':
        'Nike/2.73.3 (iPhone; iOS 16.0; Scale/3.00)',
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br'
    }
  });

  let attempts = 0;
  const maxRetries = 3;

  while (attempts < maxRetries) {
    try {
      // STEP 1: Simulated SNKRS API Add-to-Cart (replace with real SNKRS logic)
      console.log(`🛒 Attempting checkout for SKU ${sku} with profile ${profile.email}`);

      const cartRes = await axiosInstance.post(
        `https://api.nike.com/checkout/cart`,
        {
          sku,
          size: profile.size,
          quantity: 1
        }
      );

      if (cartRes.status === 200 || cartRes.data.success) {
        console.log(`✅ Checkout successful for ${sku}`);
        releaseLockedProxy(userId);
        return { success: true };
      }

      throw new Error(`Cart failed: ${JSON.stringify(cartRes.data)}`);
    } catch (err) {
      attempts++;
      console.warn(`❌ Attempt ${attempts} failed for ${sku}: ${err.message}`);
      await delay(3000);
    }
  }

  console.log(`⚠️ All HTTP checkout attempts failed. Fallback to puppeteer for ${sku}`);
  releaseLockedProxy(userId);

  // Fallback to puppeteer with new lock
  try {
    const result = await puppeteerCheckout({ sku, profile, userId });
    return result;
  } catch (fallbackErr) {
    console.error(`❌ Puppeteer fallback failed:`, fallbackErr.message);
    return { success: false, error: fallbackErr.message };
  }
}

module.exports = {
  snkrsCheckout
};
