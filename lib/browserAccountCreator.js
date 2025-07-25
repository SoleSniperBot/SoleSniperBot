const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { markEmailUsed } = require('./emailManager');
const { saveNikeSessionCookies } = require('./sessionManager');
const { fetchNike2FACodeFromIMAP } = require('./imap');
const loginNikeAccount = require('./loginNike');
const {
  generateRandomName,
  generateRandomDOB
} = require('./utils');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString, attempt = 1) {
  const userAgent = new randomUseragent().toString();
  const { firstName, lastName } = generateRandomName();
  const { day, month, year } = generateRandomDOB();

  const proxyRegex = /socks5:\/\/(.*?):(.*?)@(.*?):(.*)/;
  const match = proxyString.match(proxyRegex);
  if (!match) {
    console.error('❌ Invalid proxy format');
    return null;
  }

  const [, proxyUser, proxyPass, proxyHost, proxyPort] = match;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--proxy-server=socks5://${proxyHost}:${proxyPort}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  try {
    await page.authenticate({ username: proxyUser, password: proxyPass });
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    console.log(`🧦 Using proxy: socks5://${proxyHost}:${proxyPort}`);

    await page.goto('https://www.nike.com/gb/join', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', firstName, { delay: 50 });
    await page.type('input[name="lastName"]', lastName, { delay: 50 });

    await page.select('select[name="month"]', month);
    await page.select('select[name="day"]', day);
    await page.select('select[name="year"]', year.toString());

    await page.click('input[name="receiveEmail"]');
    await page.click('input[name="terms"]');
    await page.click('button[type="submit"]');

    // Wait for redirect or confirmation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    const finalUrl = page.url();
    console.log(`🌐 Final URL after join: ${finalUrl}`);

    if (finalUrl.includes('verify') || finalUrl.includes('member')) {
      console.log(`✅ Account created: ${email}`);

      // Confirm IMAP email
      const code = await fetchNike2FACodeFromIMAP(email);
      if (code) {
        console.log(`📩 2FA Code fetched via IMAP: ${code}`);
      } else {
        console.log(`⚠️ IMAP code not found — might already be verified`);
      }

      // Save email & login session
      await markEmailUsed(email);
      await loginNikeAccount(email, password, {
        host: proxyHost,
        port: proxyPort,
        username: proxyUser,
        password: proxyPass
      });

      await browser.close();
      return {
        email,
        password,
        firstName,
        lastName,
        dob: { day, month, year }
      };
    } else {
      throw new Error(`Account not confirmed — stuck on ${finalUrl}`);
    }

  } catch (err) {
    console.error(`❌ [BrowserAttempt ${attempt}] Failed: ${err.message}`);
    await browser.close();

    if (attempt < 3) {
      console.log(`🔁 Retrying with same proxy (Attempt ${attempt + 1}/3)...`);
      return await createNikeAccountWithBrowser(email, password, proxyString, attempt + 1);
    }

    return null;
  }
}

module.exports = { createNikeAccountWithBrowser };
