// lib/browserAccountCreator.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { generateRandomName, generateNikeEmail, generatePassword, generateDOB } = require('./utils');
const { fetchNike2FACodeFromIMAP, confirmNikeEmailLink } = require('./imap');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();
  const [firstName, lastName] = generateRandomName();
  const dob = generateDOB();

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
    // TLS & fingerprint spoofing
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114"'
    });

    if (proxyString && proxyString.includes('@')) {
      const match = proxyString.match(/\/\/(.*?):(.*?)@(.*?):(\d+)/);
      if (match) {
        const [, username, password] = match;
        await page.authenticate({ username, password });
      }
    }

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Click Join
    await page.waitForSelector('button.join-button, a[href*="register"]', { timeout: 15000 });
    await page.click('button.join-button, a[href*="register"]');

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });

    // Fill the form
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', firstName, { delay: 50 });
    await page.type('input[name="lastName"]', lastName, { delay: 50 });
    await page.select('select[name="country"]', 'GB');
    await page.select('select[name="dateOfBirth.day"]', dob.day);
    await page.select('select[name="dateOfBirth.month"]', dob.month);
    await page.select('select[name="dateOfBirth.year"]', dob.year);

    // Accept terms
    const checkboxes = await page.$$('input[type="checkbox"]');
    for (const box of checkboxes) {
      const parent = await box.evaluateHandle(node => node.closest('label'));
      if (parent) await box.click();
    }

    await page.click('input[type="submit"]');

    // Wait for possible email verification
    await page.waitForTimeout(8000);

    const code = await fetchNike2FACodeFromIMAP(email);
    if (!code) throw new Error('Nike 2FA code not found in email');

    await page.waitForSelector('input[name="code"]', { timeout: 20000 });
    await page.type('input[name="code"]', code);
    await page.click('input[type="submit"]');

    // Confirm email link
    await confirmNikeEmailLink(email);

    await browser.close();
    return {
      success: true,
      email,
      password,
      firstName,
      lastName,
      dob
    };
  } catch (err) {
    console.error('❌ Browser account creation failed:', err.message);
    await browser.close();
    return { success: false };
  }
}

module.exports = {
  createNikeAccountWithBrowser
};
