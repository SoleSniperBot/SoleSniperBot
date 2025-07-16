const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

module.exports = async function browserCreate(email, password, proxy) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--proxy-server=${proxy}`]
  });

  try {
    const page = await browser.newPage();

    await page.authenticate({
      username: proxy.split(':')[1].split('@')[0],
      password: proxy.split(':')[1].split('@')[1],
    });

    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
    );

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);

    await page.goto('https://www.nike.com/register', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 5000 });

    await page.type('input[name="emailAddress"]', email);
    await page.type('input[name="password"]', password);
    await page.type('input[name="firstName"]', 'Mark');
    await page.type('input[name="lastName"]', 'Phillips');
    await page.select('select[name="country"]', 'GB');
    await page.select('select[name="month"]', '1');
    await page.select('select[name="day"]', '1');
    await page.select('select[name="year"]', '1999');

    await page.click('input[name="receiveEmail"]');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    const success = await page.evaluate(() =>
      document.body.innerText.includes('Verify your email')
    );

    if (!success) throw new Error('Nike signup failed');

    return { email };
  } catch (err) {
    throw err;
  } finally {
    await browser.close();
  }
};
