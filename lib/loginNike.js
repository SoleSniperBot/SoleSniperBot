const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function loginNike(email, password, proxyCreds) {
  const { host, username, password: proxyPass } = proxyCreds;
  console.log(`🔐 Logging in ${email} using proxy ${host}...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      `--proxy-server=${host}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  try {
    await page.authenticate({ username, password: proxyPass });

    await page.goto('https://www.nike.com/login', { waitUntil: 'domcontentloaded', timeout: 45000 });

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', email);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);
    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });

    const cookies = await page.cookies();
    await browser.close();

    console.log(`✅ Login successful for ${email}`);
    return { session: cookies };
  } catch (err) {
    console.error(`❌ Login failed: ${err.message}`);
    await browser.close();
    return null;
  }
}

module.exports = loginNike;
