const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { markEmailUsed } = require('./emailManager');
const { fetchNike2FACode, confirmNikeEmailLink } = require('./imap');
const { saveSessionCookies } = require('./sessionManager');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxy) {
  const userAgent = new randomUseragent().toString();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      `--proxy-server=${proxy}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });
    await page.goto('https://www.nike.com/gb/join', { waitUntil: 'networkidle2', timeout: 60000 });

    // Fill form
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', 'Mark', { delay: 50 });
    await page.type('input[name="lastName"]', 'Phillips', { delay: 50 });

    await page.select('select[name="dateOfBirthDay"]', '02');
    await page.select('select[name="dateOfBirthMonth"]', '01');
    await page.select('select[name="dateOfBirthYear"]', '1996');

    await page.click('input[value="male"]');
    await page.click('input[name="receiveEmail"]');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(6000);

    const code = await fetchNike2FACode(email);
    if (!code) throw new Error('❌ Failed to get 2FA code');
    await page.type('input[name="otpCode"]', code, { delay: 50 });
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 });

    await markEmailUsed(email);
    await confirmNikeEmailLink(email);
    await saveSessionCookies(email, await page.cookies());

    await browser.close();
    return { email, password };
  } catch (err) {
    await browser.close();
    throw new Error('❌ Account creation failed: ' + err.message);
  }
}

module.exports = { createNikeAccountWithBrowser };
