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
      '--disable-dev-shm-usage',
    ]
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    console.log(`🌐 Visiting Nike Join with proxy: ${proxy}`);
    await page.goto('https://www.nike.com/gb/join', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Fill out registration form
    await page.type('input[name="emailAddress"]', email, { delay: 30 });
    await page.type('input[name="password"]', password, { delay: 30 });
    await page.type('input[name="firstName"]', 'Mark', { delay: 30 });
    await page.type('input[name="lastName"]', 'Phillips', { delay: 30 });

    await page.select('select[name="dateOfBirthDay"]', '02');
    await page.select('select[name="dateOfBirthMonth"]', '01');
    await page.select('select[name="dateOfBirthYear"]', '1996');

    await page.click('input[value="male"]');
    await page.click('input[name="receiveEmail"]');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);

    // 2FA code
    console.log(`📩 Waiting for Nike 2FA code for: ${email}`);
    const code = await fetchNike2FACode(email);
    if (!code) throw new Error('❌ Failed to get 2FA code from inbox');

    await page.type('input[name="otpCode"]', code, { delay: 30 });

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);

    await markEmailUsed(email);
    await confirmNikeEmailLink(email);
    await saveSessionCookies(email, await page.cookies());

    console.log(`✅ Account created: ${email}`);
    await browser.close();
    return { email, password };
  } catch (err) {
    console.error('❌ Browser error:', err.message);
    await browser.close();
    throw new Error('❌ Account creation failed: ' + err.message);
  }
}

module.exports = { createNikeAccountWithBrowser };
