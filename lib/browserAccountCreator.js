// lib/browserAccountCreator.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const ProxyChain = require('proxy-chain');
const { generateRandomName, generateNikeEmail, generatePassword, generateDOB } = require('./utils');
const { fetchNike2FACode } = require('./imap');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(proxy) {
  const oldProxyUrl = `socks5://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
  const newProxyUrl = await ProxyChain.anonymizeProxy(oldProxyUrl);
  const userAgent = new randomUseragent().toString();

  const firstName = generateRandomName();
  const lastName = generateRandomName();
  const email = generateNikeEmail();
  const password = generatePassword();
  const dob = generateDOB();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      `--proxy-server=${newProxyUrl}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent(userAgent);
  await page.setViewport({ width: 375, height: 812 });

  try {
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'domcontentloaded' });

    // Click Join Us (update selector as needed)
    await page.waitForSelector('a[data-qa="join-link"]', { timeout: 10000 });
    await page.click('a[data-qa="join-link"]');

    // Fill registration
    await page.waitForSelector('input[name="emailAddress"]');
    await page.type('input[name="emailAddress"]', email);
    await page.type('input[name="password"]', password);
    await page.type('input[name="firstName"]', firstName);
    await page.type('input[name="lastName"]', lastName);
    await page.select('select[name="country"]', 'GB');

    const [month, day, year] = dob.split('-');
    await page.select('select[name="dateOfBirth.month"]', month);
    await page.select('select[name="dateOfBirth.day"]', day);
    await page.select('select[name="dateOfBirth.year"]', year);

    await page.click('input[name="receiveEmail"]'); // Marketing opt-in
    await page.click('input[type="submit"]');

    // Wait for account to be created
    await page.waitForTimeout(5000);

    // Fetch and confirm email 2FA
    const code = await fetchNike2FACode(email);
    if (!code) throw new Error('❌ Failed to get 2FA code');

    await page.type('input[name="code"]', code);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);

    console.log(`✅ Created: ${email} | ${password}`);
    await browser.close();

    return {
      email,
      password,
      firstName,
      lastName,
      dob,
      proxy: oldProxyUrl,
      createdAt: new Date().toISOString()
    };

  } catch (err) {
    console.error('❌ Error in createNikeAccountWithBrowser:', err.message);
    await browser.close();
    throw err;
  }
}

module.exports = { createNikeAccountWithBrowser };
