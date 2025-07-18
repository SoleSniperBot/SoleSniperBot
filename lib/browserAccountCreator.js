const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowserAndLogin(email, password, proxyString) {
  let browser;

  try {
    const proxy = new URL(proxyString);
    const proxyArg = `--proxy-server=${proxy.protocol}//${proxy.host}`;

    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath(),
      args: [
        proxyArg,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=375,812',
        '--disable-infobars',
        '--ignore-certificate-errors',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93 SNKRS/6.24');

    if (proxy.username && proxy.password) {
      await page.authenticate({
        username: decodeURIComponent(proxy.username),
        password: decodeURIComponent(proxy.password),
      });
    }

    console.log(`🌐 [Browser] Launching Nike signup: ${email}`);
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('button[data-qa="join-link"]', { timeout: 10000 });
    await page.click('button[data-qa="join-link"]');

    // Fill in registration form
    await page.waitForSelector('input[name="emailAddress"]', { timeout: 10000 });
    await page.type('input[name="emailAddress"]', email, { delay: 15 });
    await page.type('input[name="password"]', password, { delay: 15 });
    await page.type('input[name="firstName"]', 'Chris', { delay: 15 });
    await page.type('input[name="lastName"]', 'Brown', { delay: 15 });
    await page.select('select[name="country"]', 'GB');
    await page.select('select[name="dateOfBirthDay"]', '10');
    await page.select('select[name="dateOfBirthMonth"]', '5');
    await page.select('select[name="dateOfBirthYear"]', '2000');
    await page.click('input[name="receiveEmail"]');

    // Submit form
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // Validate cookies/session
    const cookies = await page.cookies();
    const nikeSession = cookies.find(c => c.name === 'nike_session');

    if (nikeSession) {
      console.log(`✅ [Browser] Account created and logged in: ${email}`);
      return {
        success: true,
        cookies,
        email,
        password,
        fallbackUsed: true
      };
    } else {
      console.warn('❌ [Browser] No session cookie found. Likely blocked or failed.');
      return { success: false, fallbackUsed: true };
    }

  } catch (err) {
    console.error(`❌ [Browser] Failed for ${email}: ${err.message}`);
    return { success: false, error: err.message, fallbackUsed: true };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  createNikeAccountWithBrowserAndLogin,
};
