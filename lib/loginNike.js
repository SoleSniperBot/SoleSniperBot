const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { fetchNike2FACodeFromIMAP } = require('./imap');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const cookiesDir = path.join(__dirname, '../data/cookies');
if (!fs.existsSync(cookiesDir)) fs.mkdirSync(cookiesDir, { recursive: true });

module.exports = async function loginNikeAccount(email, password, proxyObjOrString = null) {
  const userAgent = new randomUseragent().toString();
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--window-size=375,812',
  ];

  let proxyObj = proxyObjOrString;

  // Parse proxy string if passed as formatted string
  if (typeof proxyObjOrString === 'string' && proxyObjOrString.startsWith('socks5://')) {
    const match = proxyObjOrString.match(/socks5:\/\/(.*?):(.*?)@(.*?):(.*)/);
    if (match) {
      const [, username, password, host, port] = match;
      proxyObj = { host, port, username, password };
    }
  }

  if (proxyObj?.host) {
    args.push(`--proxy-server=socks5://${proxyObj.host}:${proxyObj.port}`);
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args });
    const page = await browser.newPage();

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    if (proxyObj?.username && proxyObj?.password) {
      await page.authenticate({
        username: proxyObj.username,
        password: proxyObj.password,
      });
    }

    await page.goto('https://www.nike.com/login', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.click('input[type="submit"]');

    // Handle 2FA if required
    try {
      await page.waitForSelector('input[name="code"]', { timeout: 20000 });

      console.log('📩 2FA required, fetching code from IMAP...');
      const code = await fetchNike2FACodeFromIMAP(email);
      if (!code) throw new Error('2FA code not found');

      await page.type('input[name="code"]', code, { delay: 50 });
      await page.click('input[type="submit"]');
    } catch (e) {
      console.log('⚠️ 2FA not triggered or auto-skipped');
    }

    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    const cookies = await page.cookies();

    if (finalUrl.includes('member') || cookies.find(c => c.name === 'Nike_Session')) {
      const cookiePath = path.join(cookiesDir, `${email.replace(/[@.]/g, '_')}.json`);
      fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));
      console.log(`✅ [NikeLogin] Success for ${email} — session saved`);
      await browser.close();
      return { success: true, email };
    } else {
      console.log(`❌ [NikeLogin] Failed to reach profile — URL: ${finalUrl}`);
      await browser.close();
      return { success: false };
    }

  } catch (err) {
    console.error('❌ Nike login failed:', err.message);
    if (browser) await browser.close();
    return { success: false, error: err.message };
  }
};
