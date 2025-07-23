const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { SocksProxyAgent } = require('socks-proxy-agent');
const Imap = require('./imapClient');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function loginNikeAccount(email, password, proxyString) {
  const userDataDir = path.join(__dirname, `../data/sessions/${email}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    userDataDir,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--proxy-server=${proxyString}`
    ]
  });

  const page = await browser.newPage();
  try {
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.click('button[data-qa="join-login-link"]');
    await page.waitForSelector('input[name="emailAddress"]', { timeout: 20000 });

    await page.type('input[name="emailAddress"]', email, { delay: 40 });
    await page.type('input[name="password"]', password, { delay: 40 });
    await page.click('input[type="submit"]');

    // Wait for successful login or email 2FA
    await page.waitForTimeout(8000);

    const twoFA = await page.$('input[name="otpVerificationValue"]');
    if (twoFA) {
      const code = await Imap.fetchNikeCode(email);
      if (!code) throw new Error('2FA code not received');
      await page.type('input[name="otpVerificationValue"]', code.trim(), { delay: 50 });
      await page.click('input[type="submit"]');
      await page.waitForTimeout(5000);
    }

    const cookies = await page.cookies();
    const sessionPath = path.join(__dirname, `../data/sessions/${email}_cookies.json`);
    fs.writeFileSync(sessionPath, JSON.stringify(cookies, null, 2));

    console.log(`✅ [Login] Successfully logged in: ${email}`);
    await browser.close();
    return true;
  } catch (err) {
    console.error(`❌ [Login] Failed for ${email}: ${err.message}`);
    await browser.close();
    return false;
  }
}

module.exports = loginNikeAccount;
