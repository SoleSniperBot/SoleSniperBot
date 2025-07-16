const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxy) {
  const [ip, port, user, pass] = proxy.replace('http://', '').split(/[:@]/);
  const proxyUrl = `http://${user}:${pass}@${ip}:${port}`;

  console.log(`🖥️ [Browser Fallback] Starting for ${email} on proxy ${ip}:${port}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--proxy-server=${ip}:${port}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ]
  });

  try {
    const page = await browser.newPage();
    await page.authenticate({ username: user, password: pass });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    await page.goto('https://www.nike.com/gb/register', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name="emailAddress"]');

    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });
    await page.type('input[name="firstName"]', 'Mark');
    await page.type('input[name="lastName"]', 'Phillips');
    await page.select('select[name="country"]', 'GB');

    await page.click('input[name="dateOfBirth"]');
    await page.keyboard.type('01011995');

    await page.click('input[name="receiveEmail"]');
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    const success = page.url().includes('/member');
    console.log(success ? `✅ [Browser Success] ${email}` : `❌ [Browser Failed] ${email}`);
    return success;

  } catch (err) {
    console.error(`❌ [Browser Error] ${email}: ${err.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

module.exports = { createNikeAccountWithBrowser };
