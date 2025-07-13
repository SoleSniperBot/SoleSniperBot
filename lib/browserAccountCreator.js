// lib/createWithBrowser.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

module.exports = async function createWithBrowser({ email, password, proxy }) {
  try {
    if (!proxy || !proxy.includes('@')) {
      throw new Error('Invalid proxy format');
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: [`--proxy-server=${proxy}`, '--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Extract proxy auth safely
    const [, proxyCreds] = proxy.split('//');
    const [auth] = proxyCreds.split('@');
    const [username, pass] = auth.split(':');

    if (!username || !pass) {
      throw new Error('Proxy authentication credentials missing');
    }

    await page.authenticate({ username, password: pass });

    console.log(`🌐 [Browser] Attempting signup for ${email} using proxy ${proxy}`);

    await page.goto('https://www.nike.com/gb/launch', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Simulated browser signup
    console.log(`✅ [Browser] Simulated account creation for: ${email}`);
    await browser.close();

    return { fallbackUsed: true, email };
  } catch (err) {
    console.error(`❌ [Browser fallback] Error for ${email}: ${err.message}`);
    return { fallbackUsed: false, error: err.message };
  }
};
