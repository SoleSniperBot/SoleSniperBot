const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { markEmailUsed } = require('./emailManager');

puppeteer.use(StealthPlugin());

async function createWithBrowser(email, password, proxy) {
  console.log(`🌐 [Browser] Attempting signup for ${email} using proxy ${proxy}`);

  const [ip, port] = proxy.split(':');
  const proxyArgs = `--proxy-server=http://${ip}:${port}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      proxyArgs,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();

  try {
    // Optional: authenticate proxy if username:password required
    if (proxy.includes('@')) {
      const authMatch = proxy.match(/\/\/(.*?):(.*?)@/);
      if (authMatch) {
        const proxyUser = authMatch[1];
        const proxyPass = authMatch[2];
        await page.authenticate({ username: proxyUser, password: proxyPass });
      }
    }

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    // Navigate to signup
    await page.waitForSelector('[data-qa="join-login-link"]', { timeout: 15000 });
    await page.click('[data-qa="join-login-link"]');

    await page.waitForSelector('input[name="emailAddress"]');
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', 'Mark', { delay: 50 });
    await page.type('input[name="lastName"]', 'Phillips', { delay: 50 });

    // Select date of birth (static example)
    await page.select('select[name="month"]', '1');
    await page.select('select[name="day"]', '1');
    await page.select('select[name="year"]', '1996');

    // Gender selection
    await page.click('input[value="male"]');

    // Accept terms & Join
    await page.click('input[name="emailOptIn"]');
    await page.click('[data-qa="join-form-submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log(`✅ [Browser] Account created: ${email}`);
    markEmailUsed(email);
    await browser.close();
    return true;
  } catch (err) {
    console.error(`❌ [Browser fallback] Error for ${email}: ${err.message}`);
    await browser.close();
    return false;
  }
}

module.exports = {
  createWithBrowser,
};
