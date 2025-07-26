const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const fs = require('fs');
const path = require('path');
const { saveNikeSessionCookies } = require('./sessionManager');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(proxy, email, password, firstName, lastName, dob) {
  const proxyArg = proxy ? `--proxy-server=${proxy.host}:${proxy.port}` : null;
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--mute-audio',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--metrics-recording-only',
    '--no-first-run',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-features=IsolateOrigins,site-per-process',
  ];
  if (proxyArg) args.push(proxyArg);

  const userAgent = new randomUseragent(/iPhone/).toString();

  const browser = await puppeteer.launch({
    headless: 'new',
    args,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();

  if (proxy.username && proxy.password) {
    await page.authenticate({
      username: proxy.username,
      password: proxy.password,
    });
  }

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 390, height: 844 }); // iPhone 12 size

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Go to join form
    await page.waitForSelector('a[href*="/register"]', { timeout: 15000 });
    await page.click('a[href*="/register"]');

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 20000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 40 });
    await page.type('input[name="firstName"]', firstName, { delay: 40 });
    await page.type('input[name="lastName"]', lastName, { delay: 40 });

    await page.select('select[name="dateOfBirth.day"]', dob.day.toString());
    await page.select('select[name="dateOfBirth.month"]', dob.month.toString());
    await page.select('select[name="dateOfBirth.year"]', dob.year.toString());

    await page.click('input[name="gender"][value="male"]');

    await page.click('input[name="receiveEmail"]'); // marketing opt-in
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

    const currentUrl = page.url();
    if (currentUrl.includes('verification') || currentUrl.includes('member')) {
      console.log(`✅ Account created for ${email}`);
      const cookies = await page.cookies();
      await saveNikeSessionCookies(email, cookies);
      await browser.close();
      return true;
    } else {
      console.warn(`❌ Unexpected redirect after creation: ${currentUrl}`);
    }
  } catch (err) {
    console.error(`❌ Error during account creation: ${err.message}`);
  }

  await browser.close();
  return false;
}

module.exports = { createNikeAccountWithBrowser };
