const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

module.exports = async function loginToNikeAndSaveSession({ email, password, proxy }) {
  console.log(`👤 [NikeLogin] Logging in for ${email}`);

  const proxyArgs = proxy ? [`--proxy-server=${proxy}`] : [];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      ...proxyArgs
    ]
  });

  const page = await browser.newPage();

  try {
    if (proxy && proxy.includes('@')) {
      const parts = proxy.split('@');
      const auth = parts[0].replace('http://', '').split(':');
      await page.authenticate({ username: auth[0], password: auth[1] });
    }

    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
    );

    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('input[name="email"]', { timeout: 25000 });
    await page.type('input[name="email"]', email, { delay: 50 });

    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.type('input[name="password"]', password, { delay: 50 });

    await page.waitForSelector('input[type="submit"], button[type="submit"]', { timeout: 10000 });
    await page.click('input[type="submit"], button[type="submit"]');

    await page.waitForTimeout(10000); // Let it settle

    const cookies = await page.cookies();
    const sessionData = {
      email,
      cookies,
      timestamp: new Date().toISOString(),
      proxy
    };

    const fs = require('fs');
    const path = require('path');
    const sessionFile = path.join(__dirname, '../data/nike_sessions.json');

    let sessions = fs.existsSync(sessionFile) ? JSON.parse(fs.readFileSync(sessionFile)) : [];
    sessions.push(sessionData);
    fs.writeFileSync(sessionFile, JSON.stringify(sessions, null, 2));

    console.log(`✅ [NikeLogin] Session saved for ${email}`);
  } catch (err) {
    console.error(`❌ [NikeLogin] Failed to login for ${email}: ${err.message}`);
  } finally {
    await browser.close();
  }
};
