const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');

puppeteer.use(StealthPlugin());

/**
 * Creates a Nike account using browser automation (fallback if API fails).
 * @param {string} email
 * @param {string} password
 * @param {string} proxyString - in http://user:pass@ip:port format
 * @returns {Promise<boolean>}
 */
async function createNikeAccountWithBrowser(email, password, proxyString) {
  let browser;

  try {
    const proxyUrl = new URL(proxyString);
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
        '--ignore-certificate-errors',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();

    if (proxyUrl.username && proxyUrl.password) {
      await page.authenticate({
        username: decodeURIComponent(proxyUrl.username),
        password: decodeURIComponent(proxyUrl.password),
      });
    }

    // Mobile emulation
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) ' +
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 ' +
      'Mobile/15E148 Safari/604.1'
    );
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('button[data-qa="join-link"]', { timeout: 15000 });
    await page.click('button[data-qa="join-link"]');

    await page.waitForSelector('input[name="emailAddress"]');
    await page.type('input[name="emailAddress"]', email, { delay: 30 });
    await page.type('input[name="password"]', password, { delay: 30 });
    await page.type('input[name="firstName"]', 'Chris');
    await page.type('input[name="lastName"]', 'Brown');
    await page.select('select[name="country"]', 'GB');
    await page.select('select[name="dateOfBirthDay"]', '10');
    await page.select('select[name="dateOfBirthMonth"]', '1');
    await page.select('select[name="dateOfBirthYear"]', '2000');
    await page.click('input[name="receiveEmail"]');

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    const cookies = await page.cookies();
    const isLoggedIn = cookies.some(cookie => cookie.name === 'nike_session');

    if (isLoggedIn) {
      console.log(`✅ [Browser] Account created successfully: ${email}`);
      return true;
    } else {
      throw new Error('🛑 Signup failed — session cookie missing.');
    }
  } catch (err) {
    console.error(`❌ [Browser] Nike account creation error: ${err.message}`);
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  createNikeAccountWithBrowser,
};
