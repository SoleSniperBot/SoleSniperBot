// lib/browserAccountCreator.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { fetchNike2FACodeFromIMAP, confirmNikeEmailFromLink } = require('./imap');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(proxyObj, email, password, firstName, lastName, dob, attempt = 1) {
  const { host, port, username, password: proxyPass } = proxyObj;

  const userAgent = new randomUseragent().toString();
  const launchArgs = [
    `--proxy-server=socks5://${host}:${port}`,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--window-size=375,812'
  ];

  const browser = await puppeteer.launch({
    headless: true,
    args: launchArgs,
    defaultViewport: { width: 375, height: 812, isMobile: true }
  });

  const page = await browser.newPage();
  try {
    if (username && proxyPass) {
      await page.authenticate({ username, password: proxyPass });
    }

    await page.setUserAgent(userAgent);
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Go to join page
    await page.goto('https://www.nike.com/gb/register', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });

    // Fill the form
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', firstName, { delay: 50 });
    await page.type('input[name="lastName"]', lastName, { delay: 50 });

    // DOB
    const [year, month, day] = dob.split('-');
    await page.select('select[name="month"]', month.replace(/^0/, ''));
    await page.select('select[name="day"]', day.replace(/^0/, ''));
    await page.select('select[name="year"]', year);

    // Gender (default to Male)
    await page.click('input[value="male"]');

    // Accept terms
    await page.click('input[name="terms"]');

    // Submit form
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);

    const finalUrl = page.url();
    if (finalUrl.includes('/member') || finalUrl.includes('verify')) {
      console.log(`✅ Account created: ${email}`);

      // Fetch and confirm 2FA email (auto-visit link)
      const link = await fetchNike2FACodeFromIMAP(email);
      if (link && link.includes('verify')) {
        await confirmNikeEmailFromLink(link, proxyObj);
        console.log(`📬 Email verified for ${email}`);
      }

      await browser.close();
      return true;
    } else {
      throw new Error('Account creation may have failed or blocked.');
    }
  } catch (err) {
    console.error(`❌ Nike account creation error: ${err.message}`);
    await browser.close();
    return false;
  }
}

module.exports = {
  createNikeAccountWithBrowser
};
