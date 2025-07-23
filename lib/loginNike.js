// lib/loginNike.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { fetchNike2FA } = require('./imapFetcher');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');

puppeteer.use(StealthPlugin());

async function loginNikeAccount(email, password, proxyString, maxAttempts = 3) {
  const cookiesPath = path.join(__dirname, `../data/cookies/${email}.json`);
  const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let proxy = null;

    try {
      proxy = proxyString || (await getLockedProxy()).formatted;
      if (!proxy) throw new Error('❌ No valid proxy for login');

      const args = [`--proxy-server=${proxy}`, '--no-sandbox', '--disable-setuid-sandbox'];
      console.log(`🌐 [NikeLogin] Attempt ${attempt} for ${email} via ${proxy}`);

      const browser = await puppeteer.launch({
        headless: 'new',
        args,
        defaultViewport: { width: 390, height: 844 }
      });

      const page = await browser.newPage();
      await page.setUserAgent(userAgent);

      await page.goto('https://www.nike.com/gb/launch', { timeout: 90000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000); // Let JS load buttons

      // 🔍 Try login button with fallback logic
      try {
        const loginBtn = await page.waitForSelector('button[data-qa="join-login-link"], a[href*="login"]', {
          timeout: 20000
        });
        await loginBtn.click();
        console.log('✅ [NikeLogin] Clicked login button');
      } catch (err) {
        console.warn('⚠️ [NikeLogin] Login button not found — using JS fallback');
        const clicked = await page.evaluate(() => {
          const btn = document.querySelector('button[data-qa="join-login-link"]') || document.querySelector('a[href*="login"]');
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        if (!clicked) throw new Error('Login button not found or clickable');
      }

      // 🔐 Fill login form
      await page.waitForSelector('input[name="emailAddress"], input[name="email"]', { timeout: 20000 });
      await page.type('input[name="emailAddress"], input[name="email"]', email, { delay: 40 });

      await page.waitForSelector('input[name="password"]', { timeout: 15000 });
      await page.type('input[name="password"]', password, { delay: 40 });
      await page.keyboard.press('Enter');

      // 📨 Wait for 2FA
      console.log(`📨 [NikeLogin] Waiting for 2FA code for ${email}`);
      const code = await fetchNike2FA(email);
      if (!code) throw new Error('❌ No 2FA code received from IMAP');

      await page.waitForSelector('input[name="code"], input[name="otp"]', { timeout: 30000 });
      await page.type('input[name="code"], input[name="otp"]', code, { delay: 60 });
      await page.keyboard.press('Enter');

      // ✅ Wait for login success
      try {
        await Promise.race([
          page.waitForNavigation({ timeout: 30000 }),
          page.waitForSelector('[data-qa="user-button"], a[href*="/member/profile"]', { timeout: 30000 })
        ]);
      } catch (e) {
        console.warn('⚠️ [NikeLogin] Login may have succeeded without full nav');
      }

      // 💾 Save session
      const cookies = await page.cookies();
      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
      console.log(`✅ [NikeLogin] Login success: ${email}`);
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

module.exports = loginNikeAccount;
