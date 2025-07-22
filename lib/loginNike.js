const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function loginNike(email, password, proxyString) {
  console.log(`🔐 Logging in ${email}...`);
  
  const args = ['--no-sandbox', '--disable-setuid-sandbox'];
  let usingProxy = false;

  // ✅ Validate proxy
  if (proxyString && proxyString.includes(':')) {
    args.push(`--proxy-server=${proxyString}`);
    usingProxy = true;
    console.log(`🌐 Using proxy: ${proxyString}`);
  } else {
    console.warn('⚠️ Proxy not provided or invalid. Proceeding without proxy.');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://www.nike.com/login', {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', email);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    const cookies = await page.cookies();
    await browser.close();

    console.log(`✅ Login successful for ${email} ${usingProxy ? '(via proxy)' : '(no proxy)'}`);
    return { session: cookies };
  } catch (err) {
    console.error(`❌ Login failed for ${email}: ${err.message}`);
    await browser.close();
    return null;
  }
}

module.exports = loginNike;
