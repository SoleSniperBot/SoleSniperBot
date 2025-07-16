const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createProxyAgent } = require('../lib/helpers');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxy) {
  const [user, pass, host, port] = proxy.replace(/^http:\/\//, '').split(/[:@]/);
  const safeProxyLog = `${host}:${port}`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        `--proxy-server=http://${host}:${port}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    });

    const page = await browser.newPage();

    // Proxy login
    if (user && pass) {
      await page.authenticate({ username: user, password: pass });
    }

    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93');

    console.log(`🧪 [Browser] Launching Nike signup on proxy ${safeProxyLog}`);

    await page.goto('https://www.nike.com/register', { waitUntil: 'networkidle2', timeout: 30000 });

    await page.type('input[name="emailAddress"]', email);
    await page.type('input[name="password"]', password);
    await page.type('input[name="firstName"]', 'Mark');
    await page.type('input[name="lastName"]', 'Phillips');

    await page.select('select[name="country"]', 'GB');
    await page.select('select[name="dateOfBirthDay"]', '01');
    await page.select('select[name="dateOfBirthMonth"]', '01');
    await page.select('select[name="dateOfBirthYear"]', '2000');

    await page.click('input[name="gender"][value="male"]');

    await page.click('button[type="submit"]');

    await page.waitForNavigation({ timeout: 15000 });

    console.log(`✅ [Browser] Created: ${email}`);
    await browser.close();
    return true;
  } catch (err) {
    console.error(`❌ [Browser] Failed for ${email} on ${safeProxyLog}: ${err.message}`);
    return false;
  }
}

module.exports = { createNikeAccountWithBrowser };
