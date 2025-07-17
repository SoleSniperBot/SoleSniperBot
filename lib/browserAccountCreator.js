const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

module.exports = {
  createNikeAccountWithBrowser: async function (email, password, proxy) {
    const [ip, port, user, pass] = proxy.replace('http://', '').split(/[:@]/);
    const proxyUrl = `http://${ip}:${port}`;

    const args = [
      `--proxy-server=${proxyUrl}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=375,812',
      '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    ];

    let browser;

    try {
      browser = await puppeteer.launch({
        headless: 'new', // ✅ Required for Railway compatibility
        args
      });

      const page = await browser.newPage();

      // 🔐 Proxy auth
      if (user && pass) {
        await page.authenticate({ username: user, password: pass });
      }

      const registerUrl = 'https://www.nike.com/register';
      console.log(`🌐 Navigating to ${registerUrl}`);
      await page.goto(registerUrl, { waitUntil: 'networkidle2' });

      await page.waitForSelector('input[name="emailAddress"]', { timeout: 8000 });
      await page.type('input[name="emailAddress"]', email);
      await page.type('input[name="password"]', password);
      await page.type('input[name="firstName"]', 'Mark');
      await page.type('input[name="lastName"]', 'Phillips');
      await page.select('select[name="country"]', 'GB');
      await page.select('select[name="month"]', '1');
      await page.select('select[name="day"]', '1');
      await page.select('select[name="year"]', '1999');

      const checkbox = await page.$('input[name="receiveEmail"]');
      if (checkbox) await checkbox.click();

      const submit = await page.$('button[type="submit"]');
      if (!submit) throw new Error('❌ Submit button not found');
      await submit.click();

      // Wait for possible email verification page
      await page.waitForTimeout(5000);
      const success = await page.evaluate(() => document.body.innerText.includes('Verify your email'));

      if (!success) throw new Error('Nike signup may have failed — "Verify your email" not found');

      console.log(`✅ [Browser] Created: ${email}`);
      return { email };
    } catch (err) {
      console.error(`❌ [Browser Fail] ${err.message}`);
      return null;
    } finally {
      if (browser) await browser.close();
    }
  }
};
