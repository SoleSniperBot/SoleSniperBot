// lib/nikeLogin.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function loginNikeAccount(email, password, proxy) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [`--proxy-server=${proxy}`, '--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Handle proxy auth
    const [, authPart] = proxy.split('//');
    const [auth, hostPart] = authPart.split('@');
    const [proxyUser, proxyPass] = auth.split(':');

    await page.authenticate({ username: proxyUser, password: proxyPass });

    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2' });

    // Fill login form
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', email, { delay: 75 });
    await page.type('input[name="password"]', password, { delay: 75 });

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 })
    ]);

    // Save cookies
    const cookies = await page.cookies();
    const cookiePath = path.join(__dirname, `../data/cookies/${email}.json`);
    fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));

    await browser.close();
    console.log(`✅ [Login] ${email} successfully logged in and cookies saved.`);
    return { success: true };
  } catch (err) {
    console.error(`❌ [Login Error] ${email}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = { loginNikeAccount };
