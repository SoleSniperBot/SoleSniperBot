const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function loginNike(email, password, proxyInput) {
  let browser;

  try {
    // 🧠 Determine proxy format: object or string
    let proxyUrl;
    let proxyHost;
    let proxyAuth;

    if (typeof proxyInput === 'object') {
      const { host, port, username, password } = proxyInput;
      proxyHost = `${host}:${port}`;
      proxyUrl = `http://${username}:${password}@${host}:${port}`;
      proxyAuth = { username, password };
    } else if (typeof proxyInput === 'string' && proxyInput.includes('@')) {
      const [auth, host] = proxyInput.replace('http://', '').split('@');
      const [username, pass] = auth.split(':');
      proxyHost = host;
      proxyUrl = proxyInput;
      proxyAuth = { username, password: pass };
    } else {
      proxyHost = proxyInput; // e.g. "proxy.geonode.io:9000"
    }

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--proxy-server=${proxyHost}`
    ];

    browser = await puppeteer.launch({
      headless: 'new',
      args
    });

    const page = await browser.newPage();

    // ✅ Set proxy authentication if needed
    if (proxyAuth) {
      await page.authenticate(proxyAuth);
    }

    await page.setViewport({ width: 375, height: 812 });
    await page.goto('https://www.nike.com/login', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 15000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });

    const button = await page.$('input[type="submit"]');
    if (button) await button.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });

    const cookies = await page.cookies(); // you can save these if needed
    await browser.close();
    console.log(`✅ Login successful for ${email}`);
    return true;

  } catch (err) {
    if (browser) await browser.close();
    console.error(`❌ Nike login failed for ${email}: ${err.message}`);
    return false;
  }
}

module.exports = loginNike;
