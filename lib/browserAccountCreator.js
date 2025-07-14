// lib/browserAccountCreator.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxy) {
  let browser;
  try {
    const proxyURL = new URL(proxy);
    const proxyArg = `--proxy-server=${proxyURL.protocol}//${proxyURL.host}`;

    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath(),
      args: [
        proxyArg,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--ignore-certificate-errors',
        '--disable-dev-shm-usage',
        '--window-position=0,0',
      ],
    });

    const page = await browser.newPage();

    if (proxyURL.username && proxyURL.password) {
      await page.authenticate({
        username: decodeURIComponent(proxyURL.username),
        password: decodeURIComponent(proxyURL.password),
      });
    }

    // Go directly to Join page (NOT launch homepage)
    await page.goto('https://www.nike.com/register', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });

    await page.type('input[name="emailAddress"]', email, { delay: 20 });
    await page.type('input[name="password"]', password, { delay: 20 });
    await page.type('input[name="firstName"]', 'Mark');
    await page.type('input[name="lastName"]', 'Phillips');
    await page.select('select[name="country"]', 'GB');
    await page.select('select[name="dateOfBirthDay"]', '11');
    await page.select('select[name="dateOfBirthMonth"]', '5');
    await page.select('select[name="dateOfBirthYear"]', '1996');
    await page.click('input[name="receiveEmail"]');

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    const cookies = await page.cookies();
    const isLoggedIn = cookies.some(c => c.name === 'nike_session');

    if (isLoggedIn) {
      console.log(`✅ [Browser] Account created: ${email}`);
      return true;
    } else {
      throw new Error('🛑 Not logged in. Possibly failed registration.');
    }

  } catch (err) {
    console.error(`❌ [Browser] Error: ${err.message}`);
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  createNikeAccountWithBrowser,
};
