const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { SocksProxyAgent } = require('socks-proxy-agent');
puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxy) {
  const userAgent = new randomUseragent().toString();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      `--proxy-server=${proxy.host}:${proxy.port}`
    ]
  });

  const page = await browser.newPage();

  if (proxy.username && proxy.password) {
    await page.authenticate({
      username: proxy.username,
      password: proxy.password
    });
  }

  await page.setUserAgent(userAgent);
  await page.setViewport({ width: 375, height: 812 });

  try {
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });
    // continue registration...
  } catch (e) {
    console.error('❌ Navigation failed:', e.message);
    await browser.close();
    throw e;
  }

  return browser;
}
