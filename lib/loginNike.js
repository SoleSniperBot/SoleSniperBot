const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const fs = require('fs');
const path = require('path');
const { fetchNike2FACodeFromIMAP } = require('./imap');

puppeteer.use(StealthPlugin());

module.exports = async function loginNikeAccount(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--window-size=375,812',
  ];
  if (proxyString) {
    args.push(`--proxy-server=${proxyString}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args
  });

  const page = await browser.newPage();

  try {
    // Spoof headers
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114"'
    });

    // Auth for proxy
    if (proxyString.includes('@')) {
      const match = proxyString.match(/\/\/(.*?):(.*?)@(.*?):(\d+)/);
      if (match) {
        const [, username, password] = match;
        await page.authenticate({ username, password });
      }
    }

    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 20000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });

    await page.click('input[type="submit"]');
    await page.waitForTimeout(5000);

    // Wait for possible 2FA
    const url = page.url();
    if (url.includes('verify') || url.includes('code')) {
      const code = await fetchNike2FACodeFromIMAP(email);
      if (!code) throw new Error('2FA code not found from IMAP');

      await page.waitForSelector('input[name="code"]', { timeout: 20000 });
      await page.type('input[name="code"]', code, { delay: 50 });
      await page.click('input[type="submit"]');
      await page.waitForTimeout(5000);
    }

    // Check for successful login (presence of logout link or account menu)
    const cookies = await page.cookies();
    const sessionPath = path.join(__dirname, `../data/sessions/${email.replace(/[@.]/g, '_')}.json`);
    fs.writeFileSync(sessionPath, JSON.stringify(cookies, null, 2));
    console.log(`✅ Login session saved: ${sessionPath}`);

    await browser.close();
    return true;
  } catch (err) {
    console.error(`❌ [LoginNike] Login failed for ${email}:`, err.message);
    await browser.close();
    return false;
  }
};
