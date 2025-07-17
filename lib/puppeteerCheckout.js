const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function puppeteerSnkrsCheckout({ slug, profile, proxy, nikeAccount }) {
  const proxyUrl = `http://${proxy.ip}:${proxy.port}`;
  const auth = proxy.username && proxy.password ? {
    username: proxy.username,
    password: proxy.password,
  } : null;

  const browser = await puppeteer.launch({
    headless: true,
    args: [`--proxy-server=${proxyUrl}`, '--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    if (auth) await page.authenticate(auth);

    // LOGIN
    await page.goto('https://www.nike.com/login', { waitUntil: 'networkidle2' });
    await page.type('input[name="emailAddress"]', nikeAccount.email);
    await page.type('input[name="password"]', nikeAccount.password);
    await page.click('input[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Go to SNKRS product page by slug
    await page.goto(`https://www.nike.com/launch/t/${slug}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForSelector('button[data-qa="feed-buy-cta"]');
    await page.click('button[data-qa="feed-buy-cta"]');

    // Additional selectors for modal, size selection, shipping, etc.

    await browser.close();
    return true;
  } catch (err) {
    console.error(`❌ Checkout error: ${err.message}`);
    await browser.close();
    return false;
  }
}

module.exports = {
  puppeteerSnkrsCheckout
};
