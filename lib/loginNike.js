const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

module.exports = async function loginToNike(account) {
  const proxy = account.proxy || '';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      `--proxy-server=${proxy}`
    ]
  });

  const page = await browser.newPage();
  try {
    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2' });

    await page.type('input[name="emailAddress"]', account.email);
    await page.type('input[name="password"]', account.password);
    await page.click('input[type="submit"]');
    await page.waitForTimeout(5000);

    const cookies = await page.cookies();
    const sessionPath = path.join(__dirname, `../data/sessions/${account.email}.json`);
    fs.writeFileSync(sessionPath, JSON.stringify(cookies, null, 2));
    console.log(`✅ [Login] Session saved for ${account.email}`);

    return { status: 'success', email: account.email };
  } catch (err) {
    console.error('❌ [Login Error]', err.message);
    return { status: 'fail', reason: err.message };
  } finally {
    await browser.close();
  }
};
