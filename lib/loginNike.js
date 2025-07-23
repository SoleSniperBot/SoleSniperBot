const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const fs = require('fs');
const path = require('path');
const { getIMAPCredentials } = require('./imapHelper');
const fetchNikeCode = require('./fetchNikeCode'); // Make sure this file exists or is stubbed

puppeteer.use(StealthPlugin());

async function loginToNikeAndSaveSession(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();
  const proxyArgs = proxyString ? [`--proxy-server=${proxyString}`] : [];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      ...proxyArgs
    ]
  });

  const page = await browser.newPage();
  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    if (proxyString && proxyString.includes('@')) {
      const [protocol, credsHost] = proxyString.split('://');
      const [creds, hostPort] = credsHost.split('@');
      const [username, password] = creds.split(':');
      await page.authenticate({ username, password });
    }

    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2' });

    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('input[type="submit"]')
    ]);

    const cookies = await page.cookies();
    const sessionsDir = path.join(__dirname, '../data/sessions');
    if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

    const sessionPath = path.join(sessionsDir, `${email}.json`);
    fs.writeFileSync(sessionPath, JSON.stringify(cookies, null, 2));
    console.log(`â [Login] Session saved for ${email}`);

    await browser.close();
    return true;
  } catch (err) {
    console.error(`â [Login] Failed login for ${email}:`, err.message);
    await browser.close();
    return false;
  }
}

module.exports = { loginToNikeAndSaveSession };
