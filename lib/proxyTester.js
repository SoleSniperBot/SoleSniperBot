require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');

puppeteer.use(StealthPlugin());

async function testNikeProxy(stickyPort = 10000) {
  const host = 'proxy.geonode.io';
  const port = stickyPort; // rotate manually if needed (10000–10900)
  const username = process.env.GEONODE_USER;
  const password = process.env.GEONODE_PASS;

  const proxyArg = `--proxy-server=http=${host}:${port}`;
  const userAgent = new randomUseragent().toString();

  let browser;

  try {
    console.log(`🧪 Testing proxy on port ${port}...`);

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        proxyArg,
      ],
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setUserAgent(userAgent);
    await page.authenticate({ username, password });

    await page.goto('https://www.nike.com/gb', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    const title = await page.title();
    await browser.close();

    if (title.includes('Nike')) {
      console.log(`✅ Proxy on port ${port} is working.`);
      return true;
    } else {
      console.log(`⚠️ Loaded but Nike not detected on port ${port}.`);
      return false;
    }

  } catch (err) {
    if (browser) await browser.close();
    console.error(`❌ Proxy test failed on port ${port}: ${err.message}`);
    return false;
  }
}

module.exports = testNikeProxy;
