const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function loginToNikeAndSaveSession(email, password, proxyString) {
  console.log(`👤 [NikeLogin] Logging in for ${email}`);

  const proxyMatch = proxyString.match(/http:\/\/(?<username>[^:]+):(?<password>[^@]+)@(?<host>[^:]+):(?<port>\d+)/);
  if (!proxyMatch) {
    console.error('❌ [NikeLogin] Invalid proxy format');
    return;
  }

  const { username, password: proxyPass, host, port } = proxyMatch.groups;

  for (let attempt = 1; attempt <= 2; attempt++) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          `--proxy-server=${host}:${port}`,
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      });

      const page = await browser.newPage();
      await page.authenticate({ username, password: proxyPass });
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');
      await page.setViewport({ width: 375, height: 812 });

      console.log(`🌐 [NikeLogin] Attempt ${attempt}: Navigating to login page...`);
      await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2', timeout: 60000 });

      const emailInput = await Promise.race([
        page.waitForSelector('input[name="email"]', { timeout: 20000 }),
        page.waitForSelector('input[type="email"]', { timeout: 20000 }),
      ]);

      if (!emailInput) throw new Error('Email input not found');

      await page.type('input[name="email"]', email, { delay: 40 }).catch(() => {});
      await page.type('input[name="password"]', password, { delay: 40 });

      await Promise.all([
        page.click('input[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
      ]);

      const cookies = await page.cookies();
      console.log(`✅ [NikeLogin] Logged in for ${email}, session cookies ready`);

      // Save session cookies here if needed

      await browser.close();
      return true;
    } catch (err) {
      console.warn(`⚠️ [NikeLogin] Attempt ${attempt} failed: ${err.message}`);
      if (browser) await browser.close();
    }
  }

  console.error(`❌ [NikeLogin] All login attempts failed for ${email}`);
  return false;
}

module.exports = loginToNikeAndSaveSession;
