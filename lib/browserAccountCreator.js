const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getRandomName, generateGmailTrick } = require('../utils/nameUtils');
const { getImapCode, confirmNikeEmail } = require('./imap');

puppeteer.use(StealthPlugin());

async function createNikeAccount(proxy, baseEmail = 'botsolesniper@gmail.com') {
  const browser = await puppeteer.launch({
    headless: 'chrome', // TSB-style modern headless mode
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--proxy-server=http://${proxy}`,
    ],
    protocolTimeout: 120000
  });

  const page = await browser.newPage();

  // Spoof device as iPhone 14 Pro on iOS 16
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93');
  await page.setViewport({ width: 390, height: 844, isMobile: true });

  const { firstName, lastName } = getRandomName();
  const email = generateGmailTrick(baseEmail);
  const password = `Nike!${Math.floor(Math.random() * 100000)}a`;

  try {
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    await page.waitForSelector('a[href*="join"]', { timeout: 10000 });
    await page.click('a[href*="join"]');
    await page.waitForTimeout(3000);

    await page.type('input[name="emailAddress"]', email, { delay: 75 });
    await page.type('input[name="password"]', password, { delay: 75 });
    await page.type('input[name="firstName"]', firstName, { delay: 75 });
    await page.type('input[name="lastName"]', lastName, { delay: 75 });
    await page.type('input[name="dateOfBirth"]', '01/01/1999', { delay: 70 });
    await page.click('input[type="checkbox"]'); // Agree to terms
    await page.waitForTimeout(1000);

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    console.log(`📤 Submitted account: ${email}`);

    // Get IMAP 2FA code
    const code = await getImapCode(email);
    if (!code) throw new Error('❌ No 2FA code found in inbox');

    const verified = await confirmNikeEmail(email, code);
    if (!verified) throw new Error('❌ Email confirmation failed');

    console.log(`✅ Account created and verified: ${email}`);
    return { email, password, firstName, lastName };

  } catch (err) {
    console.error(`❌ Creation failed for ${email}: ${err.message}`);
    return null;
  } finally {
    await browser.close();
  }
}

module.exports = createNikeAccount;
