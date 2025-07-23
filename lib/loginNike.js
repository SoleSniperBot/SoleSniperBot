// lib/loginNike.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ImapClient = require('../lib/imap');
puppeteer.use(StealthPlugin());

async function loginToNikeAndSaveSession(email, password, proxyString) {
  console.log(`👤 [NikeLogin] Logging in for ${email}`);

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--window-size=375,812',
  ];

  if (proxyString) args.push(`--proxy-server=${proxyString}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args,
    defaultViewport: { width: 375, height: 812 },
  });

  const page = await browser.newPage();

  try {
    if (proxyString && proxyString.includes('@')) {
      const [creds] = proxyString.split('@');
      const [user, pass] = creds.replace('http://', '').split(':');
      await page.authenticate({ username: user, password: pass });
    }

    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('input[name="email"]', { timeout: 20000 });
    await page.type('input[name="email"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    // Wait for redirect
    const cookies = await page.cookies();
    console.log(`✅ [NikeLogin] Logged in for ${email}, cookies saved`);

    return { email, cookies };
  } catch (err) {
    console.error(`❌ [NikeLogin] Failed to login for ${email}:`, err.message);
    return null;
  } finally {
    await browser.close();
  }
}

module.exports = loginToNikeAndSaveSession;
