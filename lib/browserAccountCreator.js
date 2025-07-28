const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getImapCode } = require('./imapClient'); // For email 2FA
const randomUseragent = require('user-agents');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyUrl) {
  const userAgent = new randomUseragent().toString();
  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled'
  ];

  if (proxyUrl && proxyUrl.startsWith('http')) {
    launchArgs.push(`--proxy-server=${proxyUrl}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: launchArgs
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    console.log('🌐 Visiting Nike GB...');
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.waitForSelector('a[href*="join-us"]', { timeout: 20000 });
    await page.click('a[href*="join-us"]');

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });

    const firstName = 'Dee';
    const lastName = 'Sniper';
    const dobDay = '01', dobMonth = '01', dobYear = '1999';

    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', firstName, { delay: 50 });
    await page.type('input[name="lastName"]', lastName, { delay: 50 });

    await page.select('select[name="dateOfBirth.day"]', dobDay);
    await page.select('select[name="dateOfBirth.month"]', dobMonth);
    await page.select('select[name="dateOfBirth.year"]', dobYear);

    await page.click('input[name="receiveEmail"]'); // Tick marketing box
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log(`📬 Waiting for 2FA code for ${email}`);
    const code = await getImapCode(email);

    if (!code) throw new Error('❌ 2FA code not received');

    await page.waitForSelector('input[name="code"]', { timeout: 20000 });
    await page.type('input[name="code"]', code);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('✅ Nike account created and verified');
    await browser.close();

    return {
      email,
      password,
      proxy: proxyUrl,
      firstName,
      lastName,
      dob: `${dobDay}/${dobMonth}/${dobYear}`
    };

  } catch (err) {
    console.error('❌ Error during Nike account creation:', err.message);
    await browser.close();
    throw err;
  }
}

module.exports = {
  createNikeAccountWithBrowser
};
