const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const useProxy = require('puppeteer-page-proxy');
const randomUseragent = require('user-agents');
const { saveNikeSession } = require('./sessionManager');
const { markEmailUsed } = require('./emailManager');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(account) {
  const {
    email,
    password,
    proxy,
    firstName,
    lastName,
    day,
    month,
    year
  } = account;

  const userAgent = new randomUseragent().toString();

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
    await useProxy(page, proxy.formatted);
    console.log(`🧦 Using proxy: ${proxy.formatted}`);

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/launch', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // ❗ TODO: Fill out the Nike registration form below once selectors are confirmed.
    // await page.type('input[name="emailAddress"]', email);
    // await page.type('input[name="password"]', password);
    // etc...

    console.log(`✅ Created Nike account: ${email} | ${password}`);

    await markEmailUsed(email);

    const cookies = await page.cookies();
    await saveNikeSession(email, cookies, proxy.formatted);

    await browser.close();

    return true;
  } catch (err) {
    console.error('❌ [Browser] Nike creation failed:', err.message);
    await browser.close();
    return false;
  }
}

module.exports = { createNikeAccountWithBrowser };
