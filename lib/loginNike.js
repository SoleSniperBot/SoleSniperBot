const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getImapCode } = require('./imap');

puppeteer.use(StealthPlugin());

async function loginNike(email, password, proxy) {
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

  // Emulate mobile
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93');
  await page.setViewport({ width: 390, height: 844, isMobile: true });

  try {
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    await page.waitForSelector('a[href*="member"]', { timeout: 10000 });
    await page.click('a[href*="member"]');
    await page.waitForTimeout(3000);

    await page.type('input[name="emailAddress"]', email, { delay: 75 });
    await page.type('input[name="password"]', password, { delay: 75 });

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Look for 2FA step
    const content = await page.content();
    if (content.includes('We sent a code')) {
      console.log(`📥 Waiting for 2FA code for ${email}...`);
      const code = await getImapCode(email);
      if (!code) throw new Error('2FA code not found in inbox');

      await page.type('input[name="code"]', code, { delay: 100 });
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
    }

    // Confirm login success
    const cookies = await page.cookies();
    const loggedIn = cookies.some(c => c.name === 'nike_auth');
    if (!loggedIn) throw new Error('Login failed or not authenticated');

    console.log(`✅ Login successful: ${email}`);
    return true;

  } catch (err) {
    console.error(`❌ Login failed for ${email}: ${err.message}`);
    return false;

  } finally {
    await browser.close();
  }
}

module.exports = loginNike;
