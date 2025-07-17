const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();
  const proxyArgs = proxyString
    ? [`--proxy-server=${proxyString}`]
    : [];

  const browser = await puppeteer.launch({
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

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/launch', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForSelector('a[data-qa="join-link"]', { timeout: 15000 });
    await page.click('a[data-qa="join-link"]');

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', 'Mark', { delay: 50 });
    await page.type('input[name="lastName"]', 'Phillips', { delay: 50 });

    // Random DOB
    await page.select('select[name="dateOfBirth.day"]', `${Math.floor(Math.random() * 28) + 1}`);
    await page.select('select[name="dateOfBirth.month"]', `${Math.floor(Math.random() * 12) + 1}`);
    await page.select('select[name="dateOfBirth.year"]', `${1990 + Math.floor(Math.random() * 10)}`);

    await page.click('input[name="gender"][value="male"]');

    await page.click('input[name="receiveEmail"]'); // opt in

    await page.waitForTimeout(1000);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });

    const cookies = await page.cookies();
    const hasSuccessCookie = cookies.some(c => c.name === 'visitor' || c.name === 'nike');

    if (hasSuccessCookie) {
      console.log(`✅ Browser success for ${email}`);
      return true;
    }

    throw new Error('Account creation did not complete as expected.');
  } catch (err) {
    console.error(`❌ Browser fallback failed: ${err.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

module.exports = { createNikeAccountWithBrowser };
