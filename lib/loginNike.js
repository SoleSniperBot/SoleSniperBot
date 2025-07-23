require('dotenv').config();
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');
const fetchNike2FACode = require('../lib/imap');
const userAgent = require('user-agents');
const cookiesPath = path.join(__dirname, '../data/working_accounts.json');

puppeteer.use(StealthPlugin());

module.exports = async function loginNikeAccount(email, password) {
  let proxy;
  try {
    proxy = await getLockedProxy();
    console.log(`🔐 [Login] Using proxy: ${proxy.formatted}`);
  } catch (err) {
    console.error('❌ No proxy available for login');
    return;
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      `--proxy-server=${proxy.formatted}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();
  try {
    await page.setUserAgent(new userAgent().toString());
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2', timeout: 60000 });

    // Fill email
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', email, { delay: 50 });
    await page.click('input[type="submit"], button[type="submit"]');

    // Fill password
    await page.waitForTimeout(1000);
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    await page.type('input[type="password"]', password, { delay: 50 });
    await page.click('input[type="submit"], button[type="submit"]');

    // Wait for 2FA (check if needed)
    await page.waitForTimeout(4000);
    const url = page.url();
    if (url.includes('verify') || url.includes('challenge')) {
      console.log('📧 [NikeLogin] Waiting for 2FA code...');
      const code = await fetchNike2FACode(email);
      if (!code) throw new Error('❌ 2FA code not received');

      await page.waitForSelector('input[name="code"], input[type="tel"]', { timeout: 20000 });
      await page.type('input[name="code"], input[type="tel"]', code, { delay: 75 });
      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForTimeout(3000);
    }

    // Check login success
    const cookies = await page.cookies();
    const success = cookies.some(c => c.name === 'NikeRetail');

    if (success) {
      const accountData = {
        email,
        password,
        proxy: proxy.formatted,
        cookies,
        timestamp: new Date().toISOString()
      };

      let accounts = [];
      if (fs.existsSync(cookiesPath)) {
        accounts = JSON.parse(fs.readFileSync(cookiesPath));
      }
      accounts.push(accountData);
      fs.writeFileSync(cookiesPath, JSON.stringify(accounts, null, 2));

      console.log(`✅ [NikeLogin] Login successful for ${email}`);
    } else {
      console.warn(`⚠️ [NikeLogin] Login might have failed for ${email}`);
    }

    await browser.close();
    await releaseLockedProxy(proxy);
  } catch (err) {
    console.error(`❌ [NikeLogin] Login error for ${email}:`, err.message);
    await browser.close();
    await releaseLockedProxy(proxy);
  }
};
