const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();
  const args = [
    `--proxy-server=${proxyString}`,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--window-size=375,812',
    `--user-agent=${userAgent}`
  ];

  let browser;
  let page;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args
      });

      page = await browser.newPage();
      await page.setUserAgent(userAgent);
      await page.setViewport({ width: 375, height: 812 });
      await page.setDefaultNavigationTimeout(30000);

      console.log(`🌍 Navigating to Nike.com [Attempt ${attempt}]...`);
      await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

      // Wait for email input with retry fallback
      try {
        await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });
      } catch (err) {
        console.warn('⚠️ Selector not found immediately, retrying...');
        await page.waitForTimeout(2000);
        await page.waitForSelector('input[name="emailAddress"]', { timeout: 10000 });
      }

      // ✅ SUCCESS: we reached the email input page
      console.log('✅ Page loaded successfully with working proxy.');
      await browser.close();
      return true;

    } catch (err) {
      console.error(`❌ Browser account creation failed: ${err.message}`);
      if (browser) await browser.close();
    }
  }

  return false;
}

module.exports = {
  createNikeAccountWithBrowser
};
