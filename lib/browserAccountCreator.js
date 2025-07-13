const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');

puppeteer.use(StealthPlugin());

module.exports = async function createWithBrowser({ email, password, proxy }) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath(),
      args: [
        `--proxy-server=${proxy}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=375,812',
        '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93'
      ]
    });

    const page = await browser.newPage();

    // ✅ Visit the Nike sign-up page
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    // ❗ Optional: Insert full signup flow here using `page.type()` etc.

    console.log(`✅ [Browser] Fake success fallback (demo): ${email}`);
    return { fallbackUsed: true };
  } catch (err) {
    console.error('❌ Browser fallback error:', err.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
};
