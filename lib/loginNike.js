const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { fetchNike2FACode } = require('../lib/imap');
const fs = require('fs');
const path = require('path');
const { SocksProxyAgent } = require('socks-proxy-agent');

puppeteer.use(StealthPlugin());

async function loginNike(email, password, proxyUrl, sessionId) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      `--proxy-server=${proxyUrl.replace('socks5://', '')}`,
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93'
  );

  try {
    await page.goto('https://www.nike.com/gb/launch', { timeout: 20000 });

    await page.click('button[aria-label="Sign in"]');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    await page.type('input[name="email"]', email, { delay: 80 });
    await page.click('input[type="submit"]');

    await page.waitForTimeout(3000);
    await page.type('input[name="password"]', password, { delay: 80 });
    await page.click('input[type="submit"]');

    // Wait for 2FA prompt
    await page.waitForTimeout(4000);

    const code = await fetchNike2FACode(email);
    if (!code) throw new Error('2FA code not found');

    const codeInput = await page.$('input[name="code"]');
    if (codeInput) {
      await codeInput.type(code, { delay: 80 });
      await page.click('input[type="submit"]');
    }

    await page.waitForNavigation({ timeout: 10000 });

    const cookies = await page.cookies();
    const sessionPath = path.join(__dirname, `../data/sessions/${sessionId}.json`);
    fs.writeFileSync(sessionPath, JSON.stringify(cookies, null, 2));

    console.log(`✅ [Login] Session saved for ${email}`);
    await browser.close();
    return true;

  } catch (err) {
    console.error(`❌ [Login error] ${err.message}`);
    await browser.close();
    return false;
  }
}

module.exports = async function loginNikeWithRetry(email, password, sessionId = email.split('@')[0]) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const proxy = await getLockedProxy();
    if (!proxy || !proxy.formatted) {
      console.log(`❌ [Login] No proxy available on attempt ${attempt}`);
      continue;
    }

    try {
      console.log(`🔐 [Login] Attempt ${attempt} with ${proxy.formatted}`);
      const success = await loginNike(email, password, proxy.formatted, sessionId);
      await releaseLockedProxy(proxy);

      if (success) return;
    } catch (e) {
      console.error(`⚠️ Login failed: ${e.message}`);
      await releaseLockedProxy(proxy);
    }
  }

  console.log('⛔ All login attempts failed.');
};
