const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('../lib/proxyManager');

puppeteer.use(StealthPlugin());

const sessionsPath = path.join(__dirname, '../data/sessions.json');
if (!fs.existsSync(sessionsPath)) fs.writeFileSync(sessionsPath, JSON.stringify([], null, 2));

async function loginNikeAccount(email, password) {
  const proxy = await getLockedProxy(email);
  if (!proxy) return console.error('❌ No proxy available for login');

  const proxyUrl = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
  const args = [
    `--proxy-server=${proxyUrl}`,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled'
  ];

  const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1';

  const browser = await puppeteer.launch({
    headless: 'new',
    args,
    timeout: 60000
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 390, height: 844 });

    console.log(`🌍 Visiting Nike login...`);
    await page.goto('https://www.nike.com/login', { waitUntil: 'networkidle2', timeout: 60000 });

    console.log(`⌛ Waiting for login form...`);
    await page.waitForSelector('input[name="email"]', { timeout: 60000 });

    await page.type('input[name="email"]', email, { delay: 75 });
    await page.type('input[name="password"]', password, { delay: 75 });

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
    ]);

    const cookies = await page.cookies();
    const session = {
      email,
      proxy: proxy.formatted,
      cookies,
      timestamp: Date.now()
    };

    const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
    sessions.push(session);
    fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));

    console.log(`✅ [NikeLogin] Logged in and session saved for ${email}`);
  } catch (err) {
    console.error(`❌ [NikeLogin] Failed login for ${email}: ${err.message}`);
  } finally {
    await browser.close();
    releaseLockedProxy(email);
  }
}

module.exports = loginNikeAccount;
