const puppeteer = require('puppeteer');

async function createWithBrowser({ email, password, proxy }) {
  try {
    const browser = await puppeteer.launch({
      args: [
        `--proxy-server=${proxy}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=375,812',
        '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
      ],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    // Navigate to Nike
    await page.goto('https://www.nike.com/gb/launch', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Simulate a human-like interaction (placeholder for future automation)
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2000);

    console.log('✅ Browser fallback successful. Ready to automate registration.');

    await browser.close();
    return { fallbackUsed: true };
  } catch (err) {
    if (err.message.includes('ERR_PROXY_CONNECTION_FAILED')) {
      console.error('🛑 Proxy failed to connect. Check credentials or region block.');
    }
    console.error('❌ Browser fallback failed:', err.message || err);
    return null;
  }
}

module.exports = createWithBrowser;
