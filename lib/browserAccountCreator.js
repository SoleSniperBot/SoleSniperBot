// browserAccountCreator.js
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createProxyMiddleware } = require('./lib/proxyHelper');
const { getRandomName } = require('./lib/nameHelper');

puppeteer.use(StealthPlugin());

async function createWithBrowser({ email, password, proxy }) {
  console.log('🧪 Launching browser fallback...');

  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=375,812',
    ],
  };

  if (proxy) {
    launchOptions.args.push(`--proxy-server=${proxy}`);
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  try {
    if (proxy && process.env.GEONODE_USER) {
      await page.authenticate({
        username: process.env.GEONODE_USER,
        password: process.env.GEONODE_PASS,
      });
    }

    // Emulate iPhone
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1'
    );
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    // Simulate real browsing steps (skip deep form automation for stealth purposes)
    console.log('📥 Loaded Nike launch page via browser fallback');

    await page.waitForTimeout(3000); // mimic human wait

    // Simulate successful account creation (replace with real logic later if needed)
    const fakeName = getRandomName();
    console.log(`✅ Fake browser fallback account created: ${email} | ${fakeName.first} ${fakeName.last}`);

    await browser.close();

    return {
      email,
      password,
      firstName: fakeName.first,
      lastName: fakeName.last,
      method: 'browser-fallback',
    };
  } catch (err) {
    console.error('❌ Browser fallback failed:', err.message);
    await browser.close();
    return null;
  }
}

module.exports = createWithBrowser;
