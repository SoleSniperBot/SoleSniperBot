const puppeteer = require('puppeteer');

async function createWithBrowser({ email, password, proxy }) {
  try {
    const browser = await puppeteer.launch({
      args: [
        `--proxy-server=${proxy}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=375,812', // iPhone dimensions
        '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
      ],
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    // Simulate human interaction – placeholder only
    console.log('🧪 Browser launched and landed on Nike. Add steps here.');

    await browser.close();
    return { fallbackUsed: true };
  } catch (err) {
    console.error('❌ Browser fallback failed:', err.message || err);
    return null;
  }
}

module.exports = createWithBrowser;
