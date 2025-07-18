const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  console.log('🌐 Launching browser for:', email);

  const userAgent = new randomUseragent().toString();
  const proxyArgs = proxyString ? [`--proxy-server=${proxyString}`] : [];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      ...proxyArgs
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent(userAgent);
  await page.setViewport({ width: 375, height: 812 });

  try {
    await page.goto('https://www.nike.com/gb', { waitUntil: 'domcontentloaded', timeout: 45000 });
    console.log('🧭 Nike loaded, starting registration...');

    // Add more logic to complete the signup process
    // Simulate fill, click, etc (or replace with API in future)

    await browser.close();
    return { success: true, email, password };
  } catch (err) {
    console.error('❌ Browser error:', err.message);
    await browser.close();
    return { success: false };
  }
}

module.exports = {
  createNikeAccountWithBrowser
};
