const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { getNike2FACode } = require('../lib/imapFetcher');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function loginNike(email, password) {
  const proxyObj = await getLockedProxy();
  if (!proxyObj) {
    console.log('❌ No available proxy');
    return;
  }

  const proxyUrl = `http://${proxyObj.username}:${proxyObj.password}@${proxyObj.host}:${proxyObj.port}`;
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      `--proxy-server=${proxyUrl}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148');
    await page.setViewport({ width: 375, height: 812 });
    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.click('input[type="submit"]');

    await page.waitForTimeout(4000);

    // Handle 2FA
    const code = await getNike2FACode(email);
    if (code) {
      const codeInput = await page.$('input[name="otp"]');
      if (codeInput) {
        await codeInput.type(code, { delay: 50 });
        await page.click('input[type="submit"]');
      }
    }

    await page.waitForNavigation({ timeout: 15000 });
    console.log(`✅ Logged in: ${email}`);

    const cookies = await page.cookies();
    const cookiePath = path.join(__dirname, `../data/sessions/${email.replace(/[@.]/g, '_')}.json`);
    fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));
 
