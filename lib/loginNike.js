const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { fetchNike2FACodeFromIMAP } = require('./imap');
const { ProxyChain } = require('proxy-chain');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const cookiesDir = path.join(__dirname, '../data/cookies');
if (!fs.existsSync(cookiesDir)) fs.mkdirSync(cookiesDir, { recursive: true });

module.exports = async function loginNikeAccount(email, password, proxyObj = null) {
  const userAgent = new randomUseragent().toString();
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--window-size=375,812',
  ];

  let browser;
  let proxyUrl = null;

  try {
    if (proxyObj?.host) {
      const full = `socks5://${proxyObj.username}:${proxyObj.password}@${proxyObj.host}:${proxyObj.port}`;
      proxyUrl = await ProxyChain.anonymizeProxy(full);
      args.push(`--proxy-server=${proxyUrl}`);
    }

    browser = await puppeteer.launch({
      headless: true,
      args,
    });

    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    if (proxyUrl?.includes('@')) {
      const match = proxyUrl.match(/\/\/(.*?):(.*?)@/);
      if (match) {
        const [, username, password] = match;
        await page.authenticate({ username, password });
      }
    }

    await page.goto('https://www.nike.com/login', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.click('input[type="submit"]');

    // 2FA
    try {
      await page.waitForSelector('input[name="code"]', { timeout: 20000 });
      const code = await fetchNike2FACodeFromIMAP(email);
      if (!code) throw new Error('2FA code not found');
      await page.type('input[name="code"]', code, { delay: 50 });
      await page.click('input[type="submit"]');
    } catch (err) {
      console.log('⚠️ No 2FA required or handled automatically');
    }

    await page.waitForTimeout(5000);

    const finalUrl = page.url();
    const cookies = await page.cookies();

    if (finalUrl.includes('member/profile')) {
      const cookiePath = path.join(cookiesDir, `${email.replace(/[@.]/g, '_')}.json`);
      fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));
      console.log(`✅ [NikeLogin] Success for ${email} — session saved`);
      await browser.close();
      return true;
    } else {
      console.log(`❌ [NikeLogin] Failed login: ${finalUrl}`);
      await browser.close();
      return false;
    }
  } catch (err) {
    console.error('❌ Nike login failed:', err.message);
    if (browser) await browser.close();
    return false;
  }
};
