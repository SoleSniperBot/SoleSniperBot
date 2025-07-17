const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const faker = require('faker');

puppeteer.use(StealthPlugin());

async function browserAccountCreator(proxyObj) {
  const { host, port } = proxyObj;
  const proxy = `http://${process.env.GEONODE_USER}:${process.env.GEONODE_PASS}@${host}:${port}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--proxy-server=${proxy}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=375,812',
      '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });

  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  const email = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Date.now()}@gmail.com`;
  const password = faker.internet.password(10) + "1aA!";

  try {
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('button[data-qa="join-login-link"]', { timeout: 15000 });
    await page.click('button[data-qa="join-login-link"]');
    await page.waitForSelector('a[data-qa="join-link"]', { timeout: 15000 });
    await page.click('a[data-qa="join-link"]');

    await page.waitForSelector('input[name="emailAddress"]');
    await page.type('input[name="emailAddress"]', email, { delay: 20 });
    await page.type('input[name="password"]', password, { delay: 20 });
    await page.type('input[name="firstName"]', firstName, { delay: 20 });
    await page.type('input[name="lastName"]', lastName, { delay: 20 });

    await page.select('select[name="dateOfBirth.month"]', '1');
    await page.select('select[name="dateOfBirth.day"]', '1');
    await page.select('select[name="dateOfBirth.year"]', '1999');

    await page.click('input[name="emailOptIn"]');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    const currentUrl = page.url();
    if (currentUrl.includes('verify') || currentUrl.includes('member')) {
      return { email, password };
    } else {
      throw new Error('Nike account creation likely failed — not redirected to member area');
    }
  } catch (err) {
    console.error('❌ Browser fallback error:', err.message);
    return null;
  } finally {
    await browser.close();
  }
}

module.exports = browserAccountCreator;
