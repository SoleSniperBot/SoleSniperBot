const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { fetchNike2FA } = require('../lib/imap');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const sessionPath = path.join(__dirname, '../data/sessions');

module.exports = async function loginNike(email, password, proxy) {
  console.log(`🌍 [NikeLogin] Logging in ${email} with proxy ${proxy}`);

  const proxyMatch = proxy.match(/http:\/\/(.*):(.*)@(.*):(\d+)/);
  const proxyUser = proxyMatch[1];
  const proxyPass = proxyMatch[2];
  const proxyHost = proxyMatch[3];
  const proxyPort = proxyMatch[4];

  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    `--proxy-server=${proxyHost}:${proxyPort}`,
  ];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: launchArgs,
    defaultViewport: { width: 390, height: 844 },
    timeout: 60000
  });

  const page = await browser.newPage();
  await page.authenticate({ username: proxyUser, password: proxyPass });

  try {
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'domcontentloaded', timeout: 60000 });

    await page.waitForSelector('button[data-qa="join-login-link"]', { timeout: 30000 });
    await page.click('button[data-qa="join-login-link"]');

    // Wait for login modal
    await page.waitForSelector('input[name="emailAddress"]', { timeout: 30000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });

    await page.type('input[name="password"]', password, { delay: 50 });
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
    ]);

    // Wait for possible 2FA
    const needs2FA = await page.$('input[name="code"]');
    if (needs2FA) {
      console.log('🔐 2FA detected, fetching code via IMAP...');
      const code = await fetchNike2FA(email, password, `${proxyHost}:${proxyPort}:${proxyUser}:${proxyPass}`);
      await page.type('input[name="code"]', code, { delay: 60 });
      await Promise.all([
        page.click('input[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
      ]);
    }

    // Validate login by checking account presence
    const success = await page.evaluate(() => {
      return !!document.querySelector('[data-qa="member-profile-link"]');
    });

    if (!success) throw new Error('Login failed – account element not found');

    // Save cookies
    const cookies = await page.cookies();
    const sessionFile = path.join(sessionPath, `${email}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(cookies, null, 2));
    console.log(`✅ [NikeLogin] Login successful and session saved for ${email}`);
  } catch (err) {
    console.error(`❌ [NikeLogin] Login failed for ${email}: ${err.message}`);
  } finally {
    await browser.close();
  }
};
