const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const faker = require('faker');

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
        '--lang=en-GB,en',
      ],
      defaultViewport: {
        width: 390,
        height: 844,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      }
    });

    const page = await browser.newPage();

    // Proxy auth
    if (proxyUrl.username && proxyUrl.password) {
      await page.authenticate({
        username: decodeURIComponent(proxyUrl.username),
        password: decodeURIComponent(proxyUrl.password),
      });
    }

    // Spoof headers
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-GB,en;q=0.9',
      'Upgrade-Insecure-Requests': '1',
    });

    // Add fingerprint spoof
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'languages', { get: () => ['en-GB', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.goto('https://www.nike.com/gb/launch', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Click Join/Sign Up
    await page.waitForSelector('button[data-qa="join-link"]', { timeout: 15000 });
    await page.click('button[data-qa="join-link"]');

    // Fill the form
    await page.waitForSelector('input[name="emailAddress"]');
    await page.type('input[name="emailAddress"]', email, { delay: 30 });
    await page.type('input[name="password"]', password, { delay: 25 });

    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();

    await page.type('input[name="firstName"]', firstName);
    await page.type('input[name="lastName"]', lastName);
    await page.select('select[name="country"]', 'GB');
    await page.select('select[name="dateOfBirthDay"]', '10');
    await page.select('select[name="dateOfBirthMonth"]', '3');
    await page.select('select[name="dateOfBirthYear"]', '1995');
    await page.click('input[name="receiveEmail"]');

    // Submit
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    const cookies = await page.cookies();
    const isLoggedIn = cookies.some(c => c.name === 'nike_session');

    if (isLoggedIn) {
      console.log(`✅ [Browser] Created: ${email}`);
      return true;
    } else {
      throw new Error('🛑 Not logged in. Account may have failed.');
    }

  } catch (err) {
    console.error(`❌ [Browser] Error: ${err.message}`);
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  createWithBrowser
};
