const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const fs = require('fs');
const path = require('path');
const Imap = require('./imapHelper'); // Should exist or be replaced
const fetchNikeCode = require('./fetchNikeCode'); // Should exist or be replaced

puppeteer.use(StealthPlugin());

async function loginToNikeAndSaveSession(email, password, proxy) {
  const userAgent = new randomUseragent().toString();
  const proxyArg = proxy && proxy.username && proxy.password
    ? `--proxy-server=http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
    : '';

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      proxyArg
    ].filter(Boolean)
  });

  const page = await browser.newPage();
  await page.setUserAgent(userAgent);
  await page.setViewport({ width: 375, height: 812 });

  try {
    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[name="emailAddress"]');
    await page.type('input[name="emailAddress"]', email, { delay: 50 });

    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', password, { delay: 50 });

    await page.click('input[value="SIGN IN"]');

    // Wait for either successful login or 2FA page
    try {
      await page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle0' });
    } catch (e) {
      console.warn('ð  [NikeLogin] Navigation delay, likely due to 2FA prompt...');
    }

    if (await page.$('input[name="code"]')) {
      console.log('ð¨ [NikeLogin] 2FA required, fetching email code...');
      const code = await fetchNikeCode(email);
      if (!code) throw new Error('2FA code not received');
      await page.type('input[name="code"]', code);
      await page.click('input[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
    }

    // Save session
    const cookies = await page.cookies();
    const sessionPath = path.join(__dirname, '../data/sessions.json');
    const sessions = fs.existsSync(sessionPath)
      ? JSON.parse(fs.readFileSync(sessionPath))
      : {};
    sessions[email] = { cookies, timestamp: Date.now() };
    fs.writeFileSync(sessionPath, JSON.stringify(sessions, null, 2));

    console.log(`â [NikeLogin] Login successful and session saved for ${email}`);
  } catch (err) {
    console.error(`â [NikeLogin] Failed to login for ${email}:`, err.message);
  } finally {
    await browser.close();
  }
}

module.exports = loginToNikeAndSaveSession;
