const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { fetchNike2FA } = require('../lib/imapFetcher');

puppeteer.use(StealthPlugin());

const loginNikeAccount = async (email, password) => {
  const cookiesPath = path.join(__dirname, `../data/cookies/${email}.json`);
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const proxy = await getLockedProxy();

    if (!proxy || !proxy.formatted) {
      console.log('❌ No valid proxy available for login');
      return;
    }

    console.log(`🌐 [NikeLogin] Attempt ${attempt} with proxy ${proxy.formatted}`);

    const args = [`--proxy-server=${proxy.formatted}`, '--no-sandbox', '--disable-setuid-sandbox'];
    const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';

    const browser = await puppeteer.launch({ headless: 'new', args });
    const page = await browser.newPage();

    try {
      await page.setUserAgent(userAgent);
      await page.setViewport({ width: 390, height: 844 });
      await page.goto('https://www.nike.com/gb/launch', { timeout: 60000 });

      // Wait for join/login button
      try {
        await page.waitForSelector('button[data-qa="join-login-link"]', { timeout: 30000 });
      } catch {
        // Try fallback selector
        await page.waitForSelector('a[href*="login"]', { timeout: 30000 });
      }

      await page.click('button[data-qa="join-login-link"], a[href*="login"]');
      await page.waitForSelector('input[name="emailAddress"], input[name="email"]', { timeout: 30000 });
      await page.type('input[name="emailAddress"], input[name="email"]', email, { delay: 50 });

      await page.waitForSelector('input[name="password"]', { timeout: 10000 });
      await page.type('input[name="password"]', password, { delay: 50 });

      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000); // Let 2FA email trigger

      // Wait and fetch 2FA code
      console.log(`📨 Waiting for 2FA code for ${email}`);
      const code = await fetchNike2FA(email);

      if (!code) throw new Error('No 2FA code received from IMAP');
      console.log(`✅ Got 2FA code: ${code}`);
      await page.waitForSelector('input[name="code"], input[name="otp"]', { timeout: 20000 });
      await page.type('input[name="code"], input[name="otp"]', code, { delay: 50 });
      await page.keyboard.press('Enter');

      // Wait for home screen or account area to confirm login success
      await page.waitForNavigation({ timeout: 30000 });
      const cookies = await page.cookies();

      fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
      console.log(`✅ Login successful: ${email}`);
      await browser.close();
      await releaseLockedProxy(proxy);
      return true;

    } catch (err) {
      console.log(`❌ [NikeLogin] Attempt ${attempt} failed for ${email}: ${err.message}`);
      await browser.close();
      await releaseLockedProxy(proxy);
      if (attempt === maxAttempts) {
        console.log('❌ All login attempts failed.');
        return false;
      }
    }
  }
};

module.exports = { loginNikeAccount };
