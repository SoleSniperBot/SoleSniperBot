const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function createNikeAccountBrowser(email, password, proxy) {
  const browser = await puppeteer.launch({
    headless: false, // ✅ Not headless for stealth
    defaultViewport: null,
    args: [
      `--proxy-server=${proxy}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=375,812', // iPhone X screen
      '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93',
    ],
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    // ✅ Example debug – simulate real interaction
    console.log(`🧪 Navigated to Nike with proxy: ${proxy}`);
    await page.waitForTimeout(5000);

    // ⚠️ Replace below with real form automation
    await page.screenshot({ path: `nike_debug_${Date.now()}.png` });

    return {
      success: true,
      message: 'Fake Nike account created in browser (replace with logic)',
    };
  } catch (err) {
    console.error('❌ Browser error:', err);
    return { success: false, error: err.message || 'Unknown error' };
  } finally {
    await browser.close();
  }
}

module.exports = createNikeAccountBrowser;
