const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function loginNike(email, password, proxyString) {
  let browser;
  try {
    const proxyHost = proxyString.includes('@') ? proxyString.split('@')[1] : proxyString;
    const proxyArgs = proxyHost ? [`--proxy-server=${proxyHost}`] : [];

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        ...proxyArgs
      ]
    });

    const page = await browser.newPage();

    if (proxyString.includes('@')) {
      const auth = proxyString.split('@')[0].replace('http://', '');
      const [username, pass] = auth.split(':');
      await page.authenticate({ username, password: pass });
    }

    await page.setViewport({ width: 375, height: 812 });
    await page.goto('https://www.nike.com/login', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });

    const button = await page.$('input[type="submit"]');
    if (button) await button.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });

    const cookies = await page.cookies();
    await browser.close();
    return true;

  } catch (err) {
    if (browser) await browser.close();
    console.error(`❌ Login failed: ${err.message}`);
    return false;
  }
}

module.exports = loginNike;
