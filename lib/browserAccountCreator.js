// lib/browserAccountCreator.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();
  const proxyArgs = proxyString ? [`--proxy-server=${proxyString.split('@').pop()}`] : [];

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

  try {
    // ⛓ Authenticate with proxy credentials if present
    if (proxyString && proxyString.includes('@')) {
      const authPart = proxyString.split('@')[0].replace('http://', '');
      const [username, password] = authPart.split(':');
      await page.authenticate({ username, password });
    }

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    // 🌐 Go to Nike signup page (or SNKRS)
    await page.goto('https://www.nike.com/gb/launch', {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    // TODO: Add your actual sign-up steps here (if automating form filling)

    const cookies = await page.cookies();
    await browser.close();

    return { session: cookies };
  } catch (err) {
    console.error(`❌ Browser account creation failed: ${err.message}`);
    await browser.close();
    return null;
  }
}

module.exports = { createNikeAccountWithBrowser };
