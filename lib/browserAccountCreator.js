const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { parseProxyString } = require('./proxyHelper');
const faker = require('faker');

puppeteer.use(StealthPlugin());

async function createWithBrowser({ email, password, proxy }) {
  const parsed = parseProxyString(proxy); // { ip, port, username, password }

  const proxyUrl = `http://${parsed.username}:${parsed.password}@${parsed.ip}:${parsed.port}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--proxy-server=${parsed.ip}:${parsed.port}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=375,812',
    ],
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();

  try {
    if (parsed.username && parsed.password) {
      await page.authenticate({
        username: parsed.username,
        password: parsed.password,
      });
    }

    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/93');

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 30000 });

    console.log('✅ Browser launched successfully. Now simulate signup or exit.');
    await new Promise(res => setTimeout(res, 5000)); // placeholder for manual logic

    // TODO: Add form interaction here
    return { status: 'simulated', email };
  } catch (err) {
    console.error('❌ Browser fallback failed:', err.message);
    return null;
  } finally {
    await browser.close();
  }
}

module.exports = createWithBrowser;
