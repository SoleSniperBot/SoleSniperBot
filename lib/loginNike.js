const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');

puppeteer.use(StealthPlugin());

async function loginNikeAccount(email, password) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const proxy = await getLockedProxy();
    if (!proxy) {
      console.error('❌ No available proxy for login');
      return false;
    }

    const proxyUrl = `socks5://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    const userAgent = new randomUseragent().toString();

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        `--proxy-server=${proxyUrl}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();

    try {
      await page.setUserAgent(userAgent);
      await page.setViewport({ width: 375, height: 812 });
      await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });

      await page.waitForSelector('button.join-log-in', { timeout: 30000 });
      await page.click('button.join-log-in');
      await page.waitForTimeout(3000);

      await page.waitForSelector('input[type="email"]', { timeout: 20000 });
      await page.type('input[type="email"]', email, { delay: 50 });

      await page.type('input[type="password"]', password, { delay: 50 });
      await page.click('input[value="SIGN IN"], button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      const cookies = await page.cookies();
      const loggedIn = cookies.some(c => c.name === 'nike') || page.url().includes('member');

      await browser.close();
      await releaseLockedProxy(proxy);

      if (loggedIn) {
        console.log(`✅ Logged in successfully: ${email}`);
        return true;
      } else {
        console.warn(`⚠️ Login attempt failed for ${email} (try ${attempt}/2)`);
      }
    } catch (err) {
      console.error(`❌ Login error on attempt ${attempt} for ${email}:`, err.message);
      await browser.close();
      await releaseLockedProxy(proxy);
    }
  }

  console.error(`❌ All login attempts failed for ${email}`);
  return false;
}

module.exports = loginNikeAccount;
