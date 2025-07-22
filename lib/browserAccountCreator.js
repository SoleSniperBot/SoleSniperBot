const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();
  const proxyHost = proxyString.includes('@') ? proxyString.split('@')[1] : proxyString;
  const proxyArgs = proxyHost ? [`--proxy-server=${proxyHost}`] : [];

  const timestamp = Date.now();
  const preScreenshot = path.join(__dirname, `../screenshots/pre-signup-${timestamp}.png`);
  const postScreenshot = path.join(__dirname, `../screenshots/post-signup-${timestamp}.png`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        ...proxyArgs
      ]
    });

    const page = await browser.newPage();

    // Auth if proxy includes credentials
    if (proxyString.includes('@')) {
      const auth = proxyString.split('@')[0].replace('http://', '');
      const [username, pass] = auth.split(':');
      await page.authenticate({ username, password: pass });
    }

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/launch', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.screenshot({ path: preScreenshot });

    // 🔧 Insert signup automation here (this is just placeholder until we add form logic)

    await page.waitForTimeout(3000); // Placeholder delay
    const cookies = await page.cookies();
    await page.screenshot({ path: postScreenshot });

    await browser.close();
    return { session: cookies };
  } catch (err) {
    if (browser) await browser.close();
    console.error(`❌ Browser account creation failed: ${err.message}`);
    return null;
  }
}

module.exports = { createNikeAccountWithBrowser };
