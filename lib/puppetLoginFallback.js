const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function puppetLoginFallback(email, password, proxy = null) {
  console.log(`🔁 [Fallback] Launching Puppeteer login for ${email}`);
  const args = ['--no-sandbox', '--disable-setuid-sandbox'];

  if (proxy) {
    args.push(`--proxy-server=${proxy}`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93');
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2' });
    
    await page.type('input[type="email"]', email);
    await page.type('input[type="password"]', password);
    await page.click('input[type="submit"], button[type="submit"]');

    await page.waitForTimeout(5000); // Adjust based on Nike's redirect delay

    // Optional: Check login success via cookies or redirect
    const cookies = await page.cookies();
    await browser.close();

    return { success: true, cookies };
  } catch (err) {
    console.error(`❌ [Fallback] Puppeteer login failed:`, err.message);
    await browser.close();
    return { success: false };
  }
}

module.exports = { puppetLoginFallback };
