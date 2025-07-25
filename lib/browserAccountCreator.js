const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { anonymizeProxy } = require('proxy-chain');
const randomUseragent = require('user-agents');
const { fetchNike2FACode } = require('./imap');
const { markEmailUsed } = require('./emailManager');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();

  console.log(`🧪 Launching browser for ${email} via proxy ${proxyString}`);
  let anonymizedProxy;

  try {
    anonymizedProxy = await anonymizeProxy(proxyString);
  } catch (err) {
    console.error('❌ Proxy anonymization failed:', err.message);
    return { success: false, error: 'proxy_failed' };
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      `--proxy-server=${anonymizedProxy}`
    ]
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    // Visit Nike Join page
    await page.goto('https://www.nike.com/gb/join', { waitUntil: 'networkidle2', timeout: 60000 });

    // Fill in account details (replace selectors as needed)
    await page.waitForSelector('input[name="emailAddress"]', { timeout: 20000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', 'Mark', { delay: 50 });
    await page.type('input[name="lastName"]', 'Phillips', { delay: 50 });

    await page.select('select[name="dateOfBirthDay"]', '10');
    await page.select('select[name="dateOfBirthMonth"]', '05');
    await page.select('select[name="dateOfBirthYear"]', '1998');

    await page.click('input[name="gender"][value="male"]');

    await page.click('input[type="checkbox"]'); // Subscribe to updates
    await page.click('button[type="submit"]');

    // Wait for email confirmation to trigger
    console.log('📩 Waiting for Nike to send 2FA email...');
    const code = await fetchNike2FACode(email);
    if (!code) {
      console.log('❌ Failed to retrieve 2FA code for:', email);
      await browser.close();
      return { success: false, error: 'no_2fa_code' };
    }

    // Fill 2FA code
    await page.waitForSelector('input[name="code"]', { timeout: 30000 });
    await page.type('input[name="code"]', code, { delay: 80 });
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
    console.log(`✅ Account created successfully: ${email}`);
    await markEmailUsed(email);

    // Optionally, save session cookies here

    await browser.close();
    return { success: true, email };
  } catch (err) {
    console.error(`❌ Browser attempt failed for ${email}:`, err.message);
    await browser.close();
    return { success: false, error: err.message };
  }
}

module.exports = { createNikeAccountWithBrowser };
