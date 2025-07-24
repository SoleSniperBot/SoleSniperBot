const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { markEmailUsed } = require('./emailManager');
const { saveNikeSession } = require('./sessionManager');
const {
  generateNikeEmail,
  generatePassword,
  generateRandomName,
  generateRandomDOB
} = require('./utils');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();
  const { firstName, lastName } = generateRandomName();
  const { day, month, year } = generateRandomDOB();

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--proxy-server=${proxyString}`, // socks5://user:pass@host:port
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  try {
    console.log(`🧦 Using proxy: ${proxyString}`);
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    // Load Nike join page
    await page.goto('https://www.nike.com/gb/join', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Fill form (selectors updated for Nike as of July 2025)
    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });

    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', firstName, { delay: 50 });
    await page.type('input[name="lastName"]', lastName, { delay: 50 });

    await page.select('select[name="month"]', month);
    await page.select('select[name="day"]', day);
    await page.select('select[name="year"]', year.toString());

    await page.click('input[name="receiveEmail"]'); // opt-in marketing
    await page.click('input[name="terms"]'); // accept terms

    await page.click('button[type="submit"]');

    // Wait for confirmation or redirection
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    console.log(`✅ Created Nike account: ${email} | ${password}`);

    // Save email & session
    await markEmailUsed(email);
    const cookies = await page.cookies();
    await saveNikeSession(email, cookies, proxyString);

    await browser.close();

    return {
      email,
      password,
      firstName,
      lastName,
      dob: { day, month, year }
    };

  } catch (err) {
    console.error('❌ [Browser] Nike creation failed:', err.message);
    await browser.close();
    return null;
  }
}

module.exports = { createNikeAccountWithBrowser };
