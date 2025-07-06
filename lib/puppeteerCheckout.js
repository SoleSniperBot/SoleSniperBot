// lib/puppeteerCheckout.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function performPuppeteerCheckout({ sku, profile, proxy }) {
  const { email, password } = profile;
  const [ip, port, username, proxyPass] = proxy.split(':');
  const proxyUrl = `http://${username}:${proxyPass}@${ip}:${port}`;

  console.log('🧪 Launching Puppeteer with proxy:', proxyUrl);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [`--proxy-server=${ip}:${port}`],
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();

    // Authenticate proxy
    if (username && proxyPass) {
      await page.authenticate({ username, password: proxyPass });
    }

    // Go to Nike
    await page.goto('https://www.nike.com/gb/launch', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Log in
    await page.click('button[data-qa="join-login-link"]');
    await page.waitForSelector('input[name="email"]', { timeout: 15000 });
    await page.type('input[name="email"]', email);
    await page.type('input[name="password"]', password);
    await page.click('input[value="SIGN IN"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });

    // Go to SKU page
    await page.goto(`https://www.nike.com/gb/launch/t/${sku}`, {
      waitUntil: 'networkidle2'
    });

    // Simulate size selection & add to cart
    await page.waitForSelector('button[data-qa="size-selector"]');
    await page.click('button[data-qa="size-selector"]');

    // Pick first available size
    await page.waitForSelector('[data-qa="size-available"]');
    await page.click('[data-qa="size-available"]');

    // Add to cart
    await page.click('button[data-qa="add-to-cart-button"]');
    await page.waitForTimeout(3000);

    console.log('🛒 Added to cart, proceeding to checkout');

    // Go to cart
    await page.goto('https://www.nike.com/cart', {
      waitUntil: 'networkidle2'
    });

    // Click checkout
    await page.waitForSelector('button[data-qa="checkout-button"]');
    await page.click('button[data-qa="checkout-button"]');

    await page.waitForTimeout(3000); // Simulate checkout (no card submission)

    console.log('✅ Puppeteer checkout flow executed (simulated success)');

    await browser.close();
    return true;

  } catch (err) {
    console.error('❌ Puppeteer checkout failed:', err.message);
    await browser.close();
    throw err;
  }
}

module.exports = {
  performPuppeteerCheckout,
};
