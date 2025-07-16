const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getRandomName, generateGmailTrick } = require('../utils/nameUtils');
const { getImapCode, confirmNikeEmail } = require('./imap');

puppeteer.use(StealthPlugin());

async function createNikeAccount(proxy, baseEmail = 'botsolesniper@gmail.com') {
  const browser = await puppeteer.launch({
    headless: 'chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--proxy-server=http://${proxy}`,
    ],
    protocolTimeout: 120000
  });

  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93');
  await page.setViewport({ width: 390, height: 844, isMobile: true });

  const { firstName, lastName } = getRandomName();
  const email = generateGmailTrick(baseEmail);
  const password = process.env.NIKE_PASSWORD;

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
    await page.click('input[type="checkbox"]');
    await page.waitForTimeout(1000);

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    console.log(`📤 Submitted: ${email} | Proxy: ${proxy}`);

    const code = await getImapCode(email);
    if (!code) throw new Error('2FA code not found in inbox');

    const verified = await confirmNikeEmail(email, code);
    if (!verified) throw new Error('Email confirmation failed');

    console.log(`✅ Created: ${email} | Proxy: ${proxy}`);
    return { email, password, firstName, lastName };
  } catch (err) {
    console.error(`❌ Creation failed for ${email} | Proxy: ${proxy} | Error: ${err.message}`);
    return null;
  } finally {
    await browser.close();
  }
}

module.exports = createNikeAccount;
