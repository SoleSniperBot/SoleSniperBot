const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { markEmailUsed } = require('./emailManager');

puppeteer.use(StealthPlugin());

async function createWithBrowser({ email, password, proxy }) {
  let browser;
  try {
    const proxyParts = proxy.replace('http://', '').split('@');
    const creds = proxyParts.length === 2 ? proxyParts[0] : null;
    const host = proxyParts.length === 2 ? proxyParts[1] : proxyParts[0];
    const [ip, port] = host.split(':');

    const launchArgs = [`--proxy-server=${ip}:${port}`, '--no-sandbox', '--disable-setuid-sandbox'];

    browser = await puppeteer.launch({
      headless: true,
      args: launchArgs,
    });

    const page = await browser.newPage();

    // Handle proxy auth
    if (creds) {
      const [username, pass] = creds.split(':');
      await page.authenticate({ username, password: pass });
    }

    console.log(`🌐 [Browser] Attempting signup for: ${email}`);

    // 🧠 Go to Nike signup page
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    // 🧠 Your automation logic here (enter form fields, submit, wait for success, etc)
    // Simulated success delay
    await new Promise(res => setTimeout(res, 2000));

    console.log(`✅ [Browser] Account created: ${email}`);
    markEmailUsed(email); // ✅ Record as used
    await browser.close();
    return { success: true, fallbackUsed: true };
  } catch (err) {
    console.error(`❌ [Browser fallback] Error for ${email}: ${err.message}`);
    if (browser) await browser.close();
    return { success: false, error: err.message };
  }
}

module.exports = { createWithBrowser };
