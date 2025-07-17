const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

module.exports = {
  createNikeAccountWithBrowser: async function (email, password, proxy) {
    const browser = await puppeteer.launch({
      headless: true,
      args: [`--proxy-server=${proxy}`]
    });

    try {
      const page = await browser.newPage();

      // Authenticate proxy (if needed)
      if (proxy.includes('@')) {
        const proxyParts = proxy.replace('http://', '').split(/[:@]/);
        const username = proxyParts[2];
        const pass = proxyParts[3];

        await page.authenticate({ username, password: pass });
      }

      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
      );

      await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });
      await page.waitForTimeout(1500);

      await page.goto('https://www.nike.com/register', { waitUntil: 'networkidle2' });

      await page.waitForSelector('input[name="emailAddress"]', { timeout: 7000 });

      await page.type('input[name="emailAddress"]', email);
      await page.type('input[name="password"]', password);
      await page.type('input[name="firstName"]', 'Mark');
      await page.type('input[name="lastName"]', 'Phillips');
      await page.select('select[name="country"]', 'GB');
      await page.select('select[name="month"]', '1');
      await page.select('select[name="day"]', '1');
      await page.select('select[name="year"]', '1999');

      const receiveEmailCheckbox = await page.$('input[name="receiveEmail"]');
      if (receiveEmailCheckbox) await receiveEmailCheckbox.click();

      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      else throw new Error('Submit button not found');

      await page.waitForTimeout(5000);

      const success = await page.evaluate(() =>
        document.body.innerText.includes('Verify your email')
      );

      if (!success) throw new Error('Nike signup may have failed — no verification text found.');

      console.log(`✅ [Browser] Account created: ${email}`);
      return { email };
    } catch (err) {
      console.error(`❌ [Browser] Signup failed: ${err.message}`);
      throw err;
    } finally {
      await browser.close();
    }
  }
};
