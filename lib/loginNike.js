const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

module.exports = async function loginToNikeAndSaveSession(email, password, proxyString) {
  if (!email || !password || !proxyString) {
    console.error('❌ [NikeLogin] Missing credentials or proxy');
    return;
  }

  const userAgent = new randomUseragent().toString();
  const proxyArgs = [`--proxy-server=${proxyString}`];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      ...proxyArgs
    ]
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.waitForSelector('input[name="email"]', { timeout: 20000 });
    await page.type('input[name="email"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });

    await page.click('input[type="submit"]');
    await page.waitForTimeout(5000);

    const cookies = await page.cookies();
    const sessionData = {
      email,
      cookies,
      proxy: proxyString,
      timestamp: new Date().toISOString(),
    };

    const sessionPath = path.join(__dirname, '../data/sessions.json');
    let existing = [];
    if (fs.existsSync(sessionPath)) {
      existing = JSON.parse(fs.readFileSync(sessionPath));
    }
    existing.push(sessionData);
    fs.writeFileSync(sessionPath, JSON.stringify(existing, null, 2));

    console.log(`✅ [NikeLogin] Logged in & session saved for ${email}`);
  } catch (err) {
    console.error(`❌ [NikeLogin] Failed to login for ${email}: ${err.message}`);
  } finally {
    await browser.close();
  }
};
