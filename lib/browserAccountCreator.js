const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');

const { markEmailUsed } = require('./emailManager');
const { saveNikeSession } = require('./sessionManager');
const { fetchNikeCodeFromIMAP, confirmNikeEmail } = require('./imap');
const { loginToNikeAccount } = require('./loginNike'); // must support puppeteer+proxy login

const {
  generateNikeEmail,
  generatePassword,
  generateRandomName,
  generateRandomDOB
} = require('./utils');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(proxyString, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔁 Attempt ${attempt}/${maxRetries} for Nike account creation`);

    const email = generateNikeEmail();
    const password = generatePassword();
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

    let browser;
    try {
      browser = await puppeteer.launch({
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

      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`✅ Created Nike account: ${email} | ${password}`);

      await markEmailUsed(email);

      // 🔐 Fetch 2FA code via IMAP
      console.log('📩 Waiting for IMAP 2FA code...');
      const code = await fetchNikeCodeFromIMAP(email);
      if (!code) throw new Error('2FA code not received via IMAP');

      console.log(`✅ Got 2FA code: ${code}`);
      await confirmNikeEmail(email, code);
      console.log('📨 Nike email confirmed');

      // 🧠 Save cookies from creation
      const cookies = await page.cookies();
      await saveNikeSession(email, cookies, proxyString);

      await browser.close();

      // 🔐 Auto login using same proxy
      const loginResult = await loginToNikeAccount(email, password, proxyString);
      if (loginResult?.success) {
        console.log(`🔓 Auto login success for ${email}`);
      } else {
        console.warn(`⚠️ Auto login failed for ${email}`);
      }

      return {
        email,
        password,
        firstName,
        lastName,
        dob: { day, month, year },
        confirmed: true
      };

    } catch (err) {
      console.error(`❌ [Attempt ${attempt}] Failed: ${err.message}`);
      if (browser) await browser.close();
    }
  }

  console.error('⛔ All retries failed. No Nike account created.');
  return null;
}

module.exports = { createNikeAccountWithBrowser };
