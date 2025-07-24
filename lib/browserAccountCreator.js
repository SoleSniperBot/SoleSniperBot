const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const useProxy = require('puppeteer-page-proxy');
const randomUseragent = require('user-agents');
const { getNikeRandomDOB, generateNikeEmail, generateRandomName, generatePassword } = require('./utils');
const { saveNikeSession } = require('./sessionManager');
const { markEmailUsed } = require('./emailManager');
const { get2FACodeFromIMAP } = require('./imap'); // If used

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(proxyString) {
  const userAgent = new randomUseragent().toString();
  const email = generateNikeEmail();
  const password = generatePassword();
  const { firstName, lastName } = generateRandomName();
  const dob = getNikeRandomDOB();

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
    ]
  });

  const page = await browser.newPage();

  try {
    await useProxy(page, proxyString);
    console.log(`🧦 Using proxy: ${proxyString}`);

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });

    // TODO: Fill the form based on Nike's registration flow using selectors

    // Example log:
    console.log(`✅ Created Nike account: ${email} | ${password}`);

    // Mark email used
    await markEmailUsed(email);

    // Save session cookies (if needed)
    const cookies = await page.cookies();
    await saveNikeSession(email, cookies, proxyString);

    await browser.close();

    return {
      email,
      password,
      firstName,
      lastName,
      dob
    };

  } catch (err) {
    console.error('❌ [Browser] Nike creation failed:', err.message);
    await browser.close();
    return null;
  }
}

module.exports = { createNikeAccountWithBrowser };
