require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { loadSession, saveSession } = require('./sessionSaver');
const { fetch2FACodeFromIMAP } = require('./imap');

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
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();
  try {
    // Proxy authentication
    await page.authenticate({ username, password: proxyPass });

    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
    );
    await page.setViewport({ width: 375, height: 812 });

    // Load cookies if available
    const session = loadSession(email);
    if (session && session.cookies?.length) {
      for (const cookie of session.cookies) {
        if (!cookie.domain) cookie.domain = '.nike.com';
        await page.setCookie(cookie);
      }
      console.log(`🍪 Loaded existing session for ${email}`);
    }

    // Go to login page
    await page.goto('https://www.nike.com/gb/login', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait and type login info
    await page.waitForSelector('input[name="email"]', { timeout: 60000 });
    await page.type('input[name="email"]', email, { delay: 30 });
    await page.type('input[name="password"]', password, { delay: 30 });

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
    ]);

    // Save session
    const cookies = await page.cookies();
    saveSession(email, { cookies });
    console.log(`✅ [NikeLogin] Logged in & session saved for ${email}`);
  } catch (err) {
    console.error(`❌ [NikeLogin] Failed to login for ${email}:`, err.message);
  } finally {
    await browser.close();
  }
}

module.exports = loginToNikeAndSaveSession;
