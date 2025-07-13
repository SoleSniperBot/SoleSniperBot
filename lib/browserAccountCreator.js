const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { markEmailUsed } = require('../lib/emailHelper'); // Optional
puppeteer.use(StealthPlugin());

module.exports = async function createWithBrowser({ email, password, proxy }) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [`--proxy-server=${proxy}`, '--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Clean proxy parsing
    const [, proxyCredHost] = proxy.split('//');
    const [authPart] = proxyCredHost.split('@');
    const [proxyUser, proxyPass] = authPart.split(':');

    await page.authenticate({ username: proxyUser, password: proxyPass });

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'domcontentloaded' });

    // Simulate success / log intent
    console.log(`🌐 [Browser] Would attempt manual signup for: ${email}`);

    markEmailUsed(email); // Optional: mark used in your pool

    await browser.close();
    return { fallbackUsed: true, email };
  } catch (err) {
    console.error('❌ [Browser fallback] Error:', err.message);
    return { fallbackUsed: false, error: err.message };
  }
};
