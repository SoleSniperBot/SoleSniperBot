const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const workingAccountsPath = path.join(__dirname, '../data/working_accounts.json');
if (!fs.existsSync(workingAccountsPath)) {
  fs.writeFileSync(workingAccountsPath, JSON.stringify([]));
}

async function loginNikeAccount(email, password, proxy) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [`--proxy-server=${proxy}`, '--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Proxy authentication
    const [, authPart] = proxy.split('//');
    const [proxyAuth] = authPart.split('@');
    const [proxyUser, proxyPass] = proxyAuth.split(':');

    await page.authenticate({ username: proxyUser, password: proxyPass });

    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2' });

    // Fill in login form
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', email, { delay: 75 });
    await page.type('input[name="password"]', password, { delay: 75 });

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 })
    ]);

    // Save session cookies
    const cookies = await page.cookies();

    // Write to working_accounts.json
    const session = {
      email,
      password,
      proxy,
      cookies,
      timestamp: new Date().toISOString()
    };

    const current = JSON.parse(fs.readFileSync(workingAccountsPath));
    current.push(session);
    fs.writeFileSync(workingAccountsPath, JSON.stringify(current, null, 2));

    await browser.close();
    console.log(`✅ [Login] ${email} successfully logged in & session saved.`);
    return { success: true };
  } catch (err) {
    console.error(`❌ [Login Error] ${email}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

module.exports = { loginNikeAccount };
