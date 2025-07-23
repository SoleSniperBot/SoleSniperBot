const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();

  const match = proxyString.match(/http:\/\/(.*?):(.*?)@(.*?):(.*)/);
  if (!match) {
    throw new Error('Invalid proxy string');
  }

  const [_, username, proxyPass, proxyHost, proxyPort] = match;
  const proxyServer = `${proxyHost}:${proxyPort}`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--proxy-server=${proxyServer}`,
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  try {
    await page.authenticate({ username, password: proxyPass });
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/launch', { timeout: 30000 });

    // Add your form fill + creation logic here...

    return { success: true }; // placeholder
  } catch (err) {
    console.error('❌ Browser account creation failed:', err.message);
    return { success: false };
  } finally {
    await browser.close();
  }
}

module.exports = { createNikeAccountWithBrowser };
