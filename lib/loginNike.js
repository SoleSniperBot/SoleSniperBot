const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function loginToNikeAndSaveSession({ email, password, proxy }) {
  console.log(`👤 [NikeLogin] Logging in for ${email}`);

  const userAgent = new randomUseragent().toString();
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      `--proxy-server=${proxy}`,
    ]
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    // Auth proxy if required
    if (proxy.includes('@')) {
      const parts = proxy.split('@');
      const auth = parts[0].replace('http://', '').split(':');
      await page.authenticate({ username: auth[0], password: auth[1] });
    }

    // Navigate to login
    await page.goto('https://www.nike.com/gb/login', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Wait for form container
    await page.waitForSelector('form[data-componentname="LoginForm"]', { timeout: 30000 });

    // Wait for email input manually with retry
    const emailSelector = 'input[name="email"]';
    let found = false;
    for (let i = 0; i < 5; i++) {
      const exists = await page.$(emailSelector);
      if (exists) {
        found = true;
        break;
      }
      console.log(`🔁 Retry ${i + 1}: Waiting for email input...`);
      await page.waitForTimeout(1000);
    }
    if (!found) throw new Error('❌ Email input never appeared');

    // Type credentials
    await page.type(emailSelector, email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.click('input[type="submit"]');

    // Wait for login redirect
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    // Save session cookies
    const cookies = await page.cookies();
    const sessionPath = path.join(__dirname, '../data/sessions', `${email}.json`);
    fs.writeFileSync(sessionPath, JSON.stringify({ cookies }, null, 2));
    console.log(`✅ [NikeLogin] Session saved for ${email}`);
  } catch (err) {
    console.error(`❌ [NikeLogin] Failed to login for ${email}: ${err.message}`);
  } finally {
    await browser.close();
  }
}

module.exports = loginToNikeAndSaveSession;
