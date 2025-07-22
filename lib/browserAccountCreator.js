const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { generateRandomName, generateRandomDOB } = require('./utils');
const confirmNikeEmail = require('./confirmNikeEmail');
const loginNikeAccount = require('./loginNike');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString, retry = 0) {
  const userAgent = new randomUseragent().toString();
  const proxyHost = proxyString.includes('@') ? proxyString.split('@')[1] : proxyString;
  const proxyArgs = proxyHost ? [`--proxy-server=${proxyHost}`] : [];

  const { firstName, lastName } = generateRandomName();
  const { day, month, year } = generateRandomDOB();

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        ...proxyArgs
      ]
    });

    const page = await browser.newPage();

    if (proxyString.includes('@')) {
      const auth = proxyString.split('@')[0].replace('http://', '');
      const [username, pass] = auth.split(':');
      await page.authenticate({ username, password: pass });
    }

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/register', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', firstName, { delay: 50 });
    await page.type('input[name="lastName"]', lastName, { delay: 50 });
    await page.type('input[name="dateOfBirth"]', `${year}-${month}-${day}`, { delay: 50 });

    const checkbox = await page.$('input[name="receiveEmail"]');
    if (checkbox) await checkbox.click();

    const submit = await page.$('input[type="submit"]');
    if (submit) await submit.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });

    const cookies = await page.cookies();
    await browser.close();

    // Confirm email via IMAP
    try {
      await confirmNikeEmail(email);
    } catch (e) {
      console.warn(`⚠️ Email confirmation failed: ${e.message}`);
    }

    // ✅ Attempt login immediately to verify session
    try {
      const parts = proxyString.replace('http://', '').split('@');
      const [username, pass] = parts[0].split(':');
      const host = parts[1];

      await loginNikeAccount(email, password, { host, username, password: pass });
      console.log(`🔐 Login success for ${email}`);
    } catch (e) {
      console.warn(`⚠️ Login failed post-creation: ${e.message}`);
    }

    return {
      session: cookies,
      firstName,
      lastName,
      dob: `${year}-${month}-${day}`
    };

  } catch (err) {
    if (browser) await browser.close();

    if (retry < 2) {
      console.warn(`🔁 Retry browser creation (${retry + 1}) for ${email}...`);
      return await createNikeAccountWithBrowser(email, password, proxyString, retry + 1);
    }

    console.error(`❌ Final failure creating ${email}: ${err.message}`);
    return null;
  }
}

module.exports = { createNikeAccountWithBrowser };
