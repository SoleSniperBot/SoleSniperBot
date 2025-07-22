const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function loginNike(email, password, proxyCreds) {
  const { host, port, username, password: proxyPass } = proxyCreds;
  const proxyUrl = `http://${host}:${port}`;
  console.log(`🔐 Logging in ${email} using proxy ${proxyUrl}...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      `--proxy-server=${proxyUrl}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  try {
    if (username && proxyPass) {
      await page.authenticate({ username, password: proxyPass });
    }

    await page.setViewport({ width: 375, height: 812 });
    await page.goto('https://www.nike.com/gb/login', {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', email, { delay: 50 });
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    await page.type('input[type="password"]', password, { delay: 50 });
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    const cookies = await page.cookies();
    await browser.close();

    console.log(`✅ Login successful for ${email}`);
    return { session: cookies };
  } catch (err) {
    console.error(`❌ Login failed for ${email}: ${err.message}`);
    await browser.close();
    return null;
  }
}

module.exports = loginNike;
