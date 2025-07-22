// lib/proxyTester.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function testNikeProxy(proxyString) {
  const proxyHost = proxyString.includes('@') ? proxyString.split('@')[1] : proxyString;
  const proxyArgs = proxyHost ? [`--proxy-server=${proxyHost}`] : [];

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        ...proxyArgs
      ],
      timeout: 30000,
    });

    const page = await browser.newPage();

    // Proxy auth
    if (proxyString.includes('@')) {
      const auth = proxyString.split('@')[0].replace('http://', '');
      const [username, password] = auth.split(':');
      await page.authenticate({ username, password });
    }

    await page.goto('https://www.nike.com/gb', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const title = await page.title();
    await browser.close();

    return title.includes('Nike') ? true : false;
  } catch (err) {
    if (browser) await browser.close();
    return false;
  }
}

module.exports = testNikeProxy;
