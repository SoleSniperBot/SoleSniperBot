// lib/browserAccountCreator.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { fetchNike2FACode, confirmNikeEmailLink } = require('./imap');
const { markEmailUsed } = require('./emailManager');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString, firstName, lastName, dob) {
  console.log('🧠 Launching Puppeteer browser for account:', email);

  const userAgent = new randomUseragent().toString();
  const proxyArgs = proxyString ? [`--proxy-server=${proxyString}`] : [];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--window-size=375,812',
      ...proxyArgs
    ]
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    console.log('🌐 Visiting Nike UK...');
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('[data-qa="join-link"]', { timeout: 15000 });
    await page.click('[data-qa="join-link"]');
    await page.waitForTimeout(3000);

    console.log('📝 Filling out account registration form...');
    await page.type('input[name="emailAddress"]', email, { delay: 40 });
    await page.type('input[name="password"]', password, { delay: 40 });
    await page.type('input[name="firstName"]', firstName, { delay: 40 });
    await page.type('input[name="lastName"]', lastName, { delay: 40 });

    await page.click('input[name="dateOfBirth"]');
    await page.type('input[name="dateOfBirth"]', dob, { delay: 40 });

    await page.select('select[name="country"]', 'GB');
    await page.select('select[name="gender"]', 'male');

    await page.click('button[type="submit"]');
    console.log('🚀 Submitted registration form...');

    await page.waitForTimeout(7000);

    const code = await fetchNike2FACode(email);
    if (!code) throw new Error('❌ 2FA code not found');

    console.log('✅ Fetched Nike 2FA code:', code);
    await page.type('input[name="code"]', code.toString());
    await page.click('button[type="submit"]');

    await page.waitForTimeout(8000);

    const cookies = await page.cookies();
    console.log('🍪 Session cookies saved for:', email);

    await markEmailUsed(email);
    await confirmNikeEmailLink(email);

    await browser.close();
    return { email, password, cookies };

  } catch (err) {
    console.error('❌ Account creation failed:', err.message);
    await browser.close();
    return null;
  }
}

module.exports = {
  createNikeAccountWithBrowser
};
