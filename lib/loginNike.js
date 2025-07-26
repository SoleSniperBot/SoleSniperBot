// lib/loginNike.js
const puppeteer = require('puppeteer-extra');
const Stealth = require('puppeteer-extra-plugin-stealth');
const randomUA = require('user-agents');
const { fetchNike2FACodeFromIMAP } = require('./imap');
const fs = require('fs');
const path = require('path');

puppeteer.use(Stealth());
const cookiesDir = path.join(__dirname, '../data/cookies');
if (!fs.existsSync(cookiesDir)) fs.mkdirSync(cookiesDir, { recursive: true });

module.exports = async function loginNikeAccount(email, password, proxyObj) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const ua = new randomUA().toString();
    const args = ['--no-sandbox','--disable-dev-shm-usage','--disable-blink-features=AutomationControlled','--window-size=375,812'];
    if (proxyObj?.host) args.push(`--proxy-server=socks5://${proxyObj.host}:${proxyObj.port}`);
    const browser = await puppeteer.launch({ headless: true, args });
    const page = await browser.newPage();
    await page.setUserAgent(ua);
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    if (proxyObj?.username) await page.authenticate({ username: proxyObj.username, password: proxyObj.password });
    await page.goto('https://www.nike.com/login', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.click('input[type="submit"]');
    try {
      await page.waitForSelector('input[name="code"]', { timeout: 20000 });
      const code = await fetchNike2FACodeFromIMAP(email);
      await page.type('input[name="code"]', code, { delay: 50 });
      await page.click('input[type="submit"]');
    } catch {}
    await page.waitForTimeout(5000);
    const finalUrl = page.url();
    const cookies = await page.cookies();
    if (finalUrl.includes('member') || cookies.find(c => c.name==='Nike_Session')) {
      fs.writeFileSync(path.join(cookiesDir, `${email.replace(/[@.]/g,'_')}.json`), JSON.stringify(cookies, null,2));
      await browser.close();
      return { success: true };
    }
    await browser.close();
  }
  return { success: false };
};
