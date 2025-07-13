const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
puppeteer.use(StealthPlugin());

async function createWithBrowser(email, password, proxy) {
  let browser;
  try {
    const proxyUrl = new URL(proxy);
    const proxyArg = `--proxy-server=${proxyUrl.protocol}//${proxyUrl.host}`;

    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath(),
      args: [
        proxyArg,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();

    // Apply proxy authentication if needed
    if (proxyUrl.username && proxyUrl.password) {
      await page.authenticate({
        username: decodeURIComponent(proxyUrl.username),
        password: decodeURIComponent(proxyUrl.password),
      });
    }

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait and click Sign Up
    await page.waitForSelector('button[data-qa="join-link"]', { timeout: 10000 });
    await page.click('button[data-qa="join-link"]');

    // Fill the form (adjust selectors as needed)
    await page.waitForSelector('input[name="emailAddress"]');
    await page.type('input[name="emailAddress"]', email, { delay: 20 });
    await page.type('input[name="password"]', password, { delay: 20 });
    await page.type('input[name="firstName"]', 'Mark');
    await page.type('input[name="lastName"]', 'Phillips');
    await page.select('select[name="country"]', 'GB');
    await page.select('select[name="dateOfBirthDay"]', '11');
    await page.select('select[name="dateOfBirthMonth"]', '5');
    await page.select('select[name="dateOfBirthYear"]', '1996');
    await page.click('input[name="receiveEmail"]');

    // Submit form
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // Confirm success by checking if logged in
    const cookies = await page.cookies();
    const isLoggedIn = cookies.some(c => c.name === 'nike_session');

    if (isLoggedIn) {
      console.log(`✅ [Browser] Account created: ${email}`);
      return true;
    } else {
      throw new Error('🛑 Account creation failed — not logged in.');
    }
  } catch (err) {
    console.error(`❌ [Browser] Error creating account: ${err.message}`);
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  createWithBrowser
};
