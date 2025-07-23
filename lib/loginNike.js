// lib/loginNike.js
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { fetch2FACodeFromIMAP } = require('./imap'); // <- Make sure this exists
const saveSession = require('./sessionSaver'); // <- Save cookies to sessions.json

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
  await page.authenticate({ username, password: proxyPass });

  try {
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari');
    await page.setViewport({ width: 390, height: 844 });

    await page.goto('https://www.nike.com/gb/login', {
      waitUntil: 'networkidle2',
      timeout: 180000 // 3x longer timeout
    });

    await page.waitForSelector('input[name="email"]', { timeout: 30000 });
    await page.type('input[name="email"]', email, { delay: 30 });
    await page.type('input[name="password"]', password, { delay: 30 });

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
    ]);

    // Check if Nike sent a 2FA code
    if (await page.$('input[name="code"]')) {
      console.log('🔐 [NikeLogin] Waiting for 2FA code from IMAP...');

      const code = await fetch2FACodeFromIMAP(email);
      if (!code) {
        console.error('❌ [NikeLogin] Failed to fetch 2FA code from email');
        await browser.close();
        return;
      }

      await page.type('input[name="code"]', code, { delay: 30 });
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
      ]);
    }

    const cookies = await page.cookies();
    await saveSession(email, cookies);

    console.log(`✅ [NikeLogin] Logged in for ${email}, session saved`);

  } catch (err) {
    console.error(`❌ [NikeLogin] Login failed for ${email}:`, err.message);
  } finally {
    await browser.close();
  }
}

module.exports = loginToNikeAndSaveSession;
