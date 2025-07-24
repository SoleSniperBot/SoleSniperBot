const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { generateRandomName, generateDOB } = require('./utils');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyUrl = null) {
  const userAgent = new randomUseragent().toString();
  const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'];

  if (proxyUrl && proxyUrl.includes('@') && proxyUrl.includes(':')) {
    args.push(`--proxy-server=${proxyUrl.replace(/^socks5:\/\//, '')}`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args
  });

  const page = await browser.newPage();

  if (proxyUrl && proxyUrl.includes('@')) {
    try {
      const match = proxyUrl.match(/\/\/(.*?):(.*?)@(.*?):(\d+)/);
      if (match) {
        const [, username, password] = match;
        await page.authenticate({ username, password });
      }
    } catch (err) {
      console.warn('⚠️ Proxy auth failed:', err.message);
    }
  }

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    // TODO: Automate signup form here with selectors (assuming you're doing that already)

    await browser.close();

    return { success: true };
  } catch (err) {
    await browser.close();
    return { success: false, error: err.message };
  }
}

module.exports = { createNikeAccountWithBrowser };
