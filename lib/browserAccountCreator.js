const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

module.exports = async function createWithBrowser({ email, password, proxy }) {
  try {
    // Extract proxy credentials
    const proxyUrl = new URL(proxy);
    const proxyHost = `${proxyUrl.hostname}:${proxyUrl.port}`;
    const proxyUser = proxyUrl.username;
    const proxyPass = proxyUrl.password;

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=${proxyHost}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page = await browser.newPage();

    if (proxyUser && proxyPass) {
      await page.authenticate({ username: proxyUser, password: proxyPass });
    }

    // === You can implement real Nike signup automation here if needed ===
    console.log(`🌐 [Browser] Simulating fallback signup for: ${email}`);

    // e.g. await page.goto('https://www.nike.com/register', { waitUntil: 'domcontentloaded' });

    await browser.close();
    return { fallbackUsed: true };
  } catch (err) {
    console.error('❌ [Browser fallback] Error:', err.message);
    return { fallbackUsed: false };
  }
};
