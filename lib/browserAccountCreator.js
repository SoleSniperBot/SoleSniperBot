const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();
  const proxyUrl = new URL(proxyString);
  const proxyHost = proxyUrl.hostname;
  const proxyPort = proxyUrl.port;
  const proxyUser = proxyUrl.username;
  const proxyPass = proxyUrl.password;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      `--proxy-server=${proxyHost}:${proxyPort}`
    ]
  });

  const page = await browser.newPage();

  try {
    await page.authenticate({
      username: proxyUser,
      password: proxyPass
    });

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb', { waitUntil: 'domcontentloaded', timeout: 60000 });

    return {
      session: await page.cookies()
    };
  } catch (err) {
    console.error('❌ Puppeteer error:', err.message);
    return null;
  } finally {
    await browser.close();
  }
}

module.exports = { createNikeAccountWithBrowser };
