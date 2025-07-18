const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');

puppeteer.use(StealthPlugin());

/**
 * Fallback Nike account creation via browser
 * Bypasses TLS protections using stealth Puppeteer
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
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-size=375,812',
        '--ignore-certificate-errors',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();

    // Authenticate proxy if needed
    if (proxyUrl.username && proxyUrl.password) {
      await page.authenticate({
        username: decodeURIComponent(proxyUrl.username),
        password: decodeURIComponent(proxyUrl.password),
      });
    }

    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93');
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('button[data-qa="join-link"]', { timeout: 15000 });
    await page.click('button[data-qa="join-link"]');

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });

    await page.type('input[name="emailAddress"]', email, { delay: 20 });
    await page.type('input[name="password"]', password, { delay: 20 });
    await page.type('input[name="firstName"]', 'Chris');
    await page.type('input[name="lastName"]', 'Brown');
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
      console.warn('⚠️ [Browser] Account creation may have failed. No nike_session cookie found.');
      console.warn('💡 TIP: Check if proxy is blocked or if CAPTCHA appeared (use headful mode to debug).');
      return false;
    }

  } catch (err) {
    console.error(`❌ [Browser] Error: ${err.message}`);
    return false;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  createNikeAccount
