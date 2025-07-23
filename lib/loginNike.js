// handlers/loginNike.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const { fetchNike2FACode } = require('../lib/imapClient'); // assumes you already use this
const { SocksProxyAgent } = require('socks-proxy-agent');

puppeteer.use(StealthPlugin());

async function loginNike(account) {
  const { email, password } = account;
  let proxy;

  try {
    proxy = await getLockedProxy();
    const proxyUrl = `${proxy.type}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        `--proxy-server=${proxyUrl}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    await page.waitForSelector('button[data-qa="join-login-button"]', { timeout: 10000 });
    await page.click('button[data-qa="join-login-button"]');

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 10000 });
    await page.type('input[name="emailAddress"]', email, { delay: 30 });
    await page.type('input[name="password"]', password, { delay: 30 });

    await Promise.all([
      page.click('input[value="SIGN IN"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    if (page.url().includes('verify')) {
      console.log(`📩 2FA triggered for ${email}`);
      const code = await fetchNike2FACode(email);
      if (!code) throw new Error('❌ 2FA code not found');

      await page.waitForSelector('input[name="code"]', { timeout: 10000 });
      await page.type('input[name="code"]', code);
      await Promise.all([
        page.click('input[value="Verify"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' })
      ]);
    }

    const cookies = await page.cookies();
    const sessionPath = path.join(__dirname, '../data/sessions', `${email}.json`);
    fs.writeFileSync(sessionPath, JSON.stringify(cookies, null, 2));

    console.log(`✅ Login successful for ${email}`);
    await browser.close();
    await releaseLockedProxy(proxy);
    return true;

  } catch (err) {
    console.error(`❌ Login failed for ${email}:`, err.message);
    if (proxy) await releaseLockedProxy(proxy);
    return false;
  }
}

module.exports = loginNike;
