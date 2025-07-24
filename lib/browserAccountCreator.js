// lib/browserAccountCreator.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { SocksProxyAgent } = require('socks-proxy-agent');
const randomUseragent = require('user-agents');
const Imap = require('../lib/imap');
const { saveSessionCookies } = require('../lib/sessionManager');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxy) {
  const userAgent = new randomUseragent().toString();

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    `--proxy-server=${proxy.formatted}`
  ];

  const browser = await puppeteer.launch({
    headless: true,
    args
  });

  const page = await browser.newPage();
  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    // 1. Navigate to Nike UK signup
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForTimeout(3000);

    // 2. Click Join Us or Create Account
    await page.evaluate(() => {
      const joinButton = [...document.querySelectorAll('a, button')].find(el =>
        /join us/i.test(el.textContent)
      );
      if (joinButton) joinButton.click();
    });

    await page.waitForTimeout(5000);

    // 3. Fill form
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', 'Dee', { delay: 50 });
    await page.type('input[name="lastName"]', 'Francis', { delay: 50 });
    await page.type('input[name="dateOfBirth"]', '05/04/1995', { delay: 50 });

    await page.click('input[value="male"]'); // Gender

    await page.click('input[name="receiveEmail"]'); // Opt-in

    await page.click('button[type="submit"]'); // Submit

    // 4. Wait and fetch email code
    await page.waitForTimeout(5000);

    const code = await Imap.waitForNikeCode(email);
    if (!code) throw new Error('Failed to fetch Nike email code');

    // 5. Fill verification code
    const codeInputs = await page.$$('input[name^="code"]');
    for (let i = 0; i < code.length; i++) {
      await codeInputs[i].type(code[i]);
    }

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log(`✅ [Browser] Account created: ${email}`);

    // 6. Save session
    const cookies = await page.cookies();
    await saveSessionCookies(email, cookies);

    await browser.close();
    return true;
  } catch (err) {
    console.error('❌ [Browser] Nike creation failed:', err.message);
    await browser.close();
    return false;
  }
}

module.exports = { createNikeAccountWithBrowser };
