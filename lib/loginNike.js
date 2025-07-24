// lib/loginNike.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { fetchNike2FACodeFromIMAP } = require('./imap');
const { ProxyChain } = require('proxy-chain');

puppeteer.use(StealthPlugin());

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
    if (proxyObj && proxyObj.host) {
      const chainedProxy = await ProxyChain.anonymizeProxy(`socks5://${proxyObj.username}:${proxyObj.password}@${proxyObj.host}:${proxyObj.port}`);
      proxyUrl = chainedProxy;
      args.push(`--proxy-server=${proxyUrl}`);
    }

    browser = await puppeteer.launch({
      headless: 'new',
      args
    });

    const page = await browser.newPage();

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    if (proxyUrl && proxyUrl.includes('@')) {
      const match = proxyUrl.match(/\/\/(.*?):(.*?)@(.*?):(\d+)/);
      if (match) {
        const [, username, password] = match;
        await page.authenticate({ username, password });
      }
    }

    await page.goto('https://www.nike.com/login', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.click('input[type="submit"]');

    // Handle 2FA if needed
    try {
      await page.waitForSelector('input[name="code"]', { timeout: 20000 });
      const code = await fetchNike2FACodeFromIMAP(email);
      if (!code) throw new Error('2FA code not found');
      await page.type('input[name="code"]', code);
      await page.click('input[type="submit"]');
    } catch (_) {}

    await page.waitForTimeout(5000);
    const url = page.url();
    if (url.includes('member/profile')) {
      await browser.close();
      return true;
    }

    await browser.close();
    return false;
  } catch (err) {
    console.error('❌ Nike login failed:', err.message);
    if (browser) await browser.close();
    return false;
  }
};
