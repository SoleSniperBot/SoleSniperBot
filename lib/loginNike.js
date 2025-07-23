const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { fetchNike2FA } = require('../lib/imapClient');
const { saveSessionCookies } = require('../lib/sessionSaver');

puppeteer.use(StealthPlugin());

module.exports = async function loginNike(email, password) {
  let proxy;
  try {
    proxy = await getLockedProxy(email);
    const proxyURL = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    const args = [`--proxy-server=${proxyURL}`];

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        ...args
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93');
    await page.setViewport({ width: 390, height: 844 });

    console.log(`🌍 [NikeLogin] Logging in for ${email}`);
    await page.goto('https://www.nike.com/login', { waitUntil: 'networkidle2', timeout: 90000 });

    await page.waitForSelector('input[name="email"]', { timeout: 90000 });
    await page.type('input[name="email"]', email, { delay: 30 });

    await page.type('input[name="password"]', password, { delay: 30 });

    await Promise.all([
      page.click('input[type="submit"], button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 90000 })
    ]);

    // 2FA Check
    const requiresCode = await page.$('input[name="otp"]');
    if (requiresCode) {
      console.log('🔐 [NikeLogin] 2FA Required, fetching code...');
      const code = await fetchNike2FA(email);
      if (!code) throw new Error('2FA code not found');

      await page.type('input[name="otp"]', code);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 90000 })
      ]);
    }

    // Check if login was successful
    const currentUrl = page.url();
    if (currentUrl.includes('member') || currentUrl.includes('account')) {
      console.log(`✅ [NikeLogin] Logged in: ${email}`);
      await saveSessionCookies(email, page);
    } else {
      throw new Error('Login failed or redirected incorrectly');
    }

    await browser.close();
    await releaseLockedProxy(email);
    return true;

  } catch (err) {
    console.error(`❌ [NikeLogin] Login failed for ${email}: ${err.message}`);
    if (proxy) await releaseLockedProxy(email);
    return false;
  }
};
