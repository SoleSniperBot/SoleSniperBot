// lib/loginNike.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const fs = require('fs');
const path = require('path');
const { getIMAPCredentials } = require('./imapHelper');
const fetchNikeCode = require('./fetchNikeCode');

puppeteer.use(StealthPlugin());

async function loginNike(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();
  const proxyHost = proxyString.includes('@') ? proxyString.split('@')[1] : proxyString;
  const proxyArgs = proxyHost ? [`--proxy-server=${proxyHost}`] : [];

  let browser;
  try {
    browser = await puppeteer.launch({
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

    if (proxyString.includes('@')) {
      const auth = proxyString.split('@')[0].replace('http://', '');
      const [username, pass] = auth.split(':');
      await page.authenticate({ username, password: pass });
    }

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/login', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });

    const loginBtn = await page.$('input[type="submit"]');
    if (loginBtn) await loginBtn.click();

    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    } catch (e) {
      console.log('⚠️ Login page timeout, possibly due to verification step.');
    }

    const url = page.url();
    if (url.includes('verify')) {
      console.log('🔐 Nike sent a verification code, fetching via IMAP...');

      const { email: inbox, password: imapPass, proxy } = getIMAPCredentials(email);
      const code = await fetchNikeCode(inbox, imapPass, proxy);

      if (!code) {
        console.error('❌ Failed to fetch 2FA code');
        await browser.close();
        return false;
      }

      console.log(`✅ 2FA Code received: ${code}`);

      const input = await page.waitForSelector('input[name="code"]', { timeout: 15000 });
      await input.type(code, { delay: 50 });

      const submit2fa = await page.$('input[type="submit"]');
      if (submit2fa) await submit2fa.click();

      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    }

    const cookies = await page.cookies();

    // Check login success
    const content = await page.content();
    if (content.includes('Hi') || cookies.some(c => c.name === 'nike_locale')) {
      const logPath = path.join(__dirname, '../data/working_accounts.json');
      const record = {
        email,
        password,
        loggedInAt: new Date().toISOString(),
        cookies
      };
      const logData = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath)) : [];
      logData.push(record);
      fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

      console.log(`✅ Logged in & session saved for ${email}`);
      await browser.close();
      return true;
    }

    console.warn(`⚠️ Login failed for ${email}`);
    await browser.close();
    return false;

  } catch (err) {
    if (browser) await browser.close();
    console.error(`❌ Login error: ${err.message}`);
    return false;
  }
}

module.exports = loginNike;
