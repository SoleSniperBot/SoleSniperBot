// lib/loginNike.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const fs = require('fs');
const path = require('path');
const { getImapCode } = require('./imap');
const { delay } = require('./utils');

puppeteer.use(StealthPlugin());

const SESSION_DIR = path.join(__dirname, '../data/sessions');

if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR);
}

async function loginToNikeAndSaveSession(email, password, proxy) {
  const proxyString = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
  const userAgent = new randomUseragent().toString();

  console.log(`👤 [NikeLogin] Logging in for ${email}`);

  for (let attempt = 1; attempt <= 2; attempt++) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          `--proxy-server=${proxyString}`,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-dev-shm-usage'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      await page.setViewport({ width: 375, height: 812 });

      await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2', timeout: 60000 });

      // Fill in email and password
      await page.waitForSelector('input[name="email"]', { timeout: 20000 });
      await page.type('input[name="email"]', email, { delay: 100 });
      await page.type('input[name="password"]', password, { delay: 100 });

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
        page.click('input[type="submit"]')
      ]);

      // Wait for potential 2FA prompt
      if (await page.$('input[name="code"]')) {
        console.log('🔐 [NikeLogin] Waiting for 2FA code...');
        const code = await getImapCode(email);
        if (!code) throw new Error('2FA code not received via IMAP');

        await page.type('input[name="code"]', code, { delay: 100 });
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
          page.click('button[type="submit"]')
        ]);
      }

      const cookies = await page.cookies();
      const sessionPath = path.join(SESSION_DIR, `${email.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
      fs.writeFileSync(sessionPath, JSON.stringify(cookies, null, 2));

      console.log(`✅ [NikeLogin] Logged in and saved session for ${email}`);
      await browser.close();
      return true;
    } catch (err) {
      console.error(`❌ [NikeLogin] Attempt ${attempt} failed for ${email}: ${err.message}`);
      if (browser) await browser.close();
      if (attempt < 2) {
        console.log(`⏳ [NikeLogin] Retrying login attempt ${attempt + 1}...`);
        await delay(1500);
      }
    }
  }

  console.error(`❌ [NikeLogin] All login attempts failed for ${email}`);
  return false;
}

module.exports = { loginToNikeAndSaveSession };
