// lib/browserAccountCreator.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { ImapFlow } = require('imapflow');
const fetch2FACode = require('./imapClient'); // Assumes you have 2FA email handling
const saveSessionCookies = require('./sessionSaver'); // Optional: save cookies

puppeteer.use(StealthPlugin());

function parseSocks5Proxy(proxyUrl) {
  const regex = /^socks5:\/\/(.*?):(.*?)@(.*?):(\d+)$/;
  const match = proxyUrl.match(regex);
  if (!match) return null;

  return {
    username: match[1],
    password: match[2],
    host: match[3],
    port: match[4]
  };
}

async function createNikeAccountWithBrowser(email, password, proxy) {
  const userAgent = new randomUseragent().toString();
  const proxyDetails = parseSocks5Proxy(proxy.formatted);

  if (!proxyDetails) {
    console.error('❌ Invalid SOCKS5 proxy format');
    return false;
  }

  const proxyArg = `--proxy-server=socks5://${proxyDetails.host}:${proxyDetails.port}`;
  const launchArgs = [
    proxyArg,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage'
  ];

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: launchArgs,
      ignoreHTTPSErrors: true
    });

    const page = await browser.newPage();

    // Authenticate SOCKS5 proxy if needed
    await page.authenticate({
      username: proxyDetails.username,
      password: proxyDetails.password
    });

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    // Navigate to Nike UK sign up
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('a[href*="join"]', { timeout: 10000 });
    await page.click('a[href*="join"]');

    await page.waitForSelector('input[name="emailAddress"]');
    await page.type('input[name="emailAddress"]', email);
    await page.type('input[name="password"]', password);
    await page.type('input[name="firstName"]', 'Jordan');
    await page.type('input[name="lastName"]', 'Sniper');
    await page.type('input[name="dateOfBirth"]', '01/01/1997');
    await page.select('select[name="country"]', 'GB');
    await page.click('input[name="receiveEmail"]'); // Subscribe
    await page.click('input[type="submit"]');

    // Wait for confirmation or 2FA
    await page.waitForTimeout(10000);

    // Optional: fetch 2FA code via IMAP (if triggered)
    const code = await fetch2FACode(email);
    if (code) {
      const inputSelector = 'input[name="code"]';
      await page.waitForSelector(inputSelector);
      await page.type(inputSelector, code);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    // Save session cookies if needed
    if (saveSessionCookies) {
      const cookies = await page.cookies();
      await saveSessionCookies(email, cookies);
    }

    console.log(`✅ Account created: ${email}`);
    await browser.close();
    return true;
  } catch (err) {
    console.error('❌ [BrowserCreator] Error:', err.message);
    if (browser) await browser.close();
    return false;
  }
}

module.exports = {
  createNikeAccountWithBrowser
};
