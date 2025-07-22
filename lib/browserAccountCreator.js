const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  console.log(`⚙️ Creating Nike account for: ${email}`);

  if (!proxyString || !proxyString.includes(':')) {
    throw new Error('❌ No valid proxy string provided. Aborting account creation.');
  }

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    `--proxy-server=${proxyString}`,
  ];

  const browser = await puppeteer.launch({ headless: 'new', args });
  const page = await browser.newPage();

  try {
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.goto('https://www.nike.com/register', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('input[name="emailAddress"]');
    await page.type('input[name="emailAddress"]', email);

    await page.type('input[name="password"]', password);
    await page.type('input[name="firstName"]', 'Mark');
    await page.type('input[name="lastName"]', 'Phillips');
    await page.type('input[name="dateOfBirth"]', '01/01/1998');
    await page.select('select[name="country"]', 'GB');
    await page.click('input[type="checkbox"]'); // opt-in

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });

    const cookies = await page.cookies();
    await browser.close();

    console.log(`✅ Nike account created for ${email}`);
    return { email, session: cookies };
  } catch (err) {
    console.error(`❌ Account creation failed for ${email}: ${err.message}`);
    await browser.close();
    return null;
  }
}

module.exports = { createNikeAccountWithBrowser };
