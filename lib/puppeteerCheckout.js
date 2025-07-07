const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');
const path = require('path');

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function puppeteerCheckout({ sku, profile, userId }) {
  const proxy = await getLockedProxy(userId);
  if (!proxy) throw new Error('No proxy available for checkout.');

  const [host, port, username, password] = proxy.split(':');
  const proxyUrl = `http://${username}:${password}@${host}:${port}`;

  let browser;
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          `--proxy-server=${host}:${port}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
        executablePath: process.env.CHROMIUM_PATH || undefined
      });

      const page = await browser.newPage();

      if (username && password) {
        await page.authenticate({ username, password });
      }

      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 SNKRS/6.6'
      );

      // ✅ Go to the product page
      await page.goto(`https://www.nike.com/launch/t/${sku}`, { waitUntil: 'domcontentloaded', timeout: 20000 });

      // ✅ Simulate login + cart + checkout (fake flow - update as needed)
      // Example selectors – replace with real ones from reverse engineering
      await delay(2000);
      await page.click('button[class*=buy-button]');
      await delay(2000);
      await page.type('#email', profile.email);
      await page.type('#cardNumber', profile.cardNumber);
      await page.type('#expMonth', profile.expMonth);
      await page.type('#expYear', profile.expYear);
      await page.type('#cvv', profile.cvv);
      await delay(1000);
      await page.click('button[class*=submit]');

      await page.waitForTimeout(4000);

      // ✅ Optional: Save screenshot
      await page.screenshot({ path: `checkout-${userId}-${sku}.png` });

      await browser.close();
      releaseLockedProxy(userId);
      return { success: true };
    } catch (err) {
      attempt++;
      console.log(`❌ Attempt ${attempt} failed for ${userId}:`, err.message);
      if (browser) await browser.close();
      await delay(3000); // wait before retry
    }
  }

  releaseLockedProxy(userId);
  return { success: false, error: 'All retry attempts failed' };
}

module.exports = {
  puppeteerCheckout
};
