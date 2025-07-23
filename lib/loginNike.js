const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { fetchNike2FA } = require('./imapFetcher');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');

puppeteer.use(StealthPlugin());

async function loginToNikeAndSaveSession(email, password, proxyString, maxAttempts = 3) {
  const cookiesPath = path.join(__dirname, `../data/cookies/${email}.json`);
  const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let proxy = null;

    try {
      proxy = proxyString || (await getLockedProxy()).formatted;
      const parsed = new URL(proxy);
      const hostPort = parsed.host;
      const proxyUsername = parsed.username;
      const proxyPassword = parsed.password;

      const args = [`--proxy-server=${hostPort}`, '--no-sandbox', '--disable-setuid-sandbox'];
      console.log(`🌐 [NikeLogin] Attempt ${attempt} for ${email} via ${hostPort}`);

      const browser = await puppeteer.launch({
        headless: 'new',
        args,
        defaultViewport: { width: 390, height: 844 }
      });

      const page = await browser.newPage();
      await page.setUserAgent(userAgent);

      // 🔐 Set proxy credentials
      if (proxyUsername && proxyPassword) {
        await page.authenticate({
          username: proxyUsername,
          password: proxyPassword
        });
      }

      await page.goto('https://www.nike.com/gb/launch', { timeout: 90000, waitUntil: 'domcontentloaded' });

      // Click login
      try {
        await Promise.race([
          page.waitForSelector('button[data-qa="join-login-link"]', { timeout: 20000 }),
          page.waitForSelector('a[href*="login"]', { timeout: 20000 })
        ]);
        await page.click('button[data-qa="join-login-link"], a[href*="login"]');
      } catch (e) {
        console.error('⚠️ Login button not found');
        throw e;
      }

      await page.waitForSelector('input[name="emailAddress"], input[name="email"]', { timeout: 20000 });
      await page.type('input[name="emailAddress"], input[name="email"]', email, { delay: 40 });

      await page.waitForSelector('input[name="password"]', { timeout: 15000 });
      await page.type('input[name="password"]', password, { delay: 40 });
      await page.keyboard.press('Enter');

      // Wait for 2FA
      console.log(`📨 Waiting for Nike 2FA code for ${email}`);
      const code = await fetchNike2FA(email);
      if (!code) throw new Error('❌ No 2FA code received');

      await page.waitForSelector('input[name="code"], input[name="otp"]', { timeout: 30000 });
      await page.type('input[name="code"], input[name="otp"]', code, { delay: 60 });
      await page.keyboard.press('Enter');

      await Promise.race([
        page.waitForNavigation({ timeout: 30000 }),
        page.waitForSelector('[data-qa="user-button"], a[href*="/member/profile"]', { timeout: 30000 })
      ]);

      const cookies = await page.cookies();
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
      console.log(`✅ Login success: ${email}`);

      await browser.close();
      if (!proxyString) await releaseLockedProxy(proxy);
      return true;

    } catch (err) {
      console.error(`❌ [NikeLogin] Attempt ${attempt} failed for ${email}: ${err.message}`);
      if (!proxyString && proxy) await releaseLockedProxy(proxy);
    }
  }

  console.error(`❌ All Nike login attempts failed for ${email}`);
  return false;
}

module.exports = loginToNikeAndSaveSession;
