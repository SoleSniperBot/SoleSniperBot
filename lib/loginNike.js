const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function loginToNikeAndSaveSession(email, password, proxyString) {
  console.log(`👤 [NikeLogin] Logging in for ${email}`);

  const proxyMatch = proxyString.match(/http:\/\/(?<username>[^:]+):(?<password>[^@]+)@(?<host>[^:]+):(?<port>\d+)/);
  if (!proxyMatch) {
    console.error('❌ [NikeLogin] Invalid proxy format');
    return;
  }

  const { username, password: proxyPass, host, port } = proxyMatch.groups;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      `--proxy-server=${host}:${port}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();

  try {
    await page.authenticate({ username, password: proxyPass });

    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    );
    await page.setViewport({ width: 375, height: 812 });

    console.log(`🌐 Visiting Nike login...`);
    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('input[name="email"]', { timeout: 60000 });
    await page.type('input[name="email"]', email, { delay: 60 });
    await page.type('input[name="password"]', password, { delay: 60 });

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
    ]);

    const cookies = await page.cookies();
    const cookiePath = path.join(__dirname, '../data/sessions', `${email}.json`);
    fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));

    console.log(`✅ [NikeLogin] Logged in and session saved: ${email}`);
  } catch (err) {
    console.error(`❌ [NikeLogin] Failed to login for ${email}:`, err.message);
  } finally {
    await browser.close();
  }
}

module.exports = loginToNikeAndSaveSession;
