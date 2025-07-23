const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const sessionsPath = path.join(__dirname, '../data/sessions.json');
if (!fs.existsSync(sessionsPath)) {
  fs.writeFileSync(sessionsPath, JSON.stringify({}));
}

module.exports = async function loginToNikeAndSaveSession(email, password, proxyString) {
  const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93';

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage'
  ];

  if (proxyString) {
    args.push(`--proxy-server=${proxyString}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    console.log(`🌍 [NikeLogin] Navigating to login page...`);
    await page.goto('https://www.nike.com/login', { waitUntil: 'networkidle2', timeout: 60000 });

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`⏳ [NikeLogin] Waiting for login fields... (Try ${attempt})`);
        await page.waitForSelector('input[name="email"]', { timeout: 60000 });
        await page.waitForSelector('input[name="password"]', { timeout: 60000 });

        await page.type('input[name="email"]', email, { delay: 50 });
        await page.type('input[name="password"]', password, { delay: 50 });

        await Promise.all([
          page.click('button[type="submit"]'),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
        ]);

        const cookies = await page.cookies();

        const sessions = JSON.parse(fs.readFileSync(sessionsPath));
        sessions[email] = {
          cookies,
          timestamp: Date.now(),
          proxy: proxyString || null
        };
        fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));

        console.log(`✅ [NikeLogin] Session saved for ${email}`);
        await browser.close();
        return true;
      } catch (innerErr) {
        console.warn(`⚠️ [NikeLogin] Retry ${attempt} failed: ${innerErr.message}`);
      }
    }

    throw new Error('Login failed after 2 attempts');
  } catch (err) {
    console.error(`❌ [NikeLogin] Failed to login for ${email}: ${err.message}`);
    await browser.close();
    return false;
  }
};
