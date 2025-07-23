const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const accountsPath = path.join(__dirname, '../data/working_accounts.json');
if (!fs.existsSync(accountsPath)) fs.writeFileSync(accountsPath, JSON.stringify([]));

async function loginToNikeAndSaveSession(email, password, proxy) {
  console.log(`🔐 Logging into Nike to save session for ${email}...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      `--proxy-server=http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
    ]
  });

  const page = await browser.newPage();

  try {
    await page.authenticate({
      username: proxy.username,
      password: proxy.password
    });

    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2', timeout: 30000 });

    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.click('input[value="SIGN IN"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    const cookies = await page.cookies();

    const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
    accounts.push({
      email,
      password,
      proxy,
      cookies,
      timestamp: Date.now()
    });
    fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2));

    console.log(`✅ Session saved for ${email}`);
  } catch (err) {
    console.error(`❌ Login failed for ${email}:`, err.message);
  } finally {
    await browser.close();
  }
}

module.exports = { loginToNikeAndSaveSession };
