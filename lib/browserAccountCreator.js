const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxy) {
  const proxyParts = proxy.replace('http://', '').split(/[:@]/);
  const [username, pass, host, port] = proxyParts.length === 4 ? proxyParts : [];

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--proxy-server=http://${host}:${port}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=375,812'
    ]
  });

  const page = await browser.newPage();

  if (username && pass) {
    await page.authenticate({ username, password: pass });
  }

  try {
    await page.goto('https://www.nike.com/register', { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.type('input[name="emailAddress"]', email);
    await page.type('input[name="password"]', password);
    await page.type('input[name="firstName"]', 'Mark');
    await page.type('input[name="lastName"]', 'Phillips');
    await page.select('select[name="country"]', 'GB');
    await page.select('select[name="dateOfBirthDay"]', '1');
    await page.select('select[name="dateOfBirthMonth"]', '1');
    await page.select('select[name="dateOfBirthYear"]', '1998');
    await page.click('input[name="receiveEmail"]');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);

    const success = await page.$('div[class*="success"]');
    await browser.close();

    return !!success;
  } catch (err) {
    console.error(`🛑 Puppeteer error: ${err.message}`);
    await browser.close();
    return false;
  }
}

module.exports = { createNikeAccountWithBrowser };
