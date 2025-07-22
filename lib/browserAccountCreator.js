const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  const userAgent = new randomUseragent().toString();
  const proxyArgs = proxyString ? [`--proxy-server=${proxyString.split('@').pop()}`] : [];

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

    if (proxyString.includes('@')) {
      const auth = proxyString.split('@')[0].replace('http://', '');
      const [username, password] = auth.split(':');
      await page.authenticate({ username, password });
    }

    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    await page.goto('https://www.nike.com/gb/launch', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.screenshot({ path: `screenshots/pre-signup-${Date.now()}.png` });

    // ✍️ Insert signup form logic here if automating registration

    const cookies = await page.cookies();
    await page.screenshot({ path: `screenshots/post-signup-${Date.now()}.png` });

    await browser.close();
    return { session: cookies };
  } catch (err) {
    if (browser) await browser.close();
    console.error(`❌ Browser account creation failed: ${err.message}`);
    return null;
  }
}

module.exports = { createNikeAccountWithBrowser };
