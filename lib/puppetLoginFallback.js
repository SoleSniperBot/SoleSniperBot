const { launch } = require('puppeteer');
const { SocksProxyAgent } = require('socks-proxy-agent');
const fs = require('fs');
const path = require('path');
const { getLockedProxy, releaseLockedProxy } = require('./proxyManager');

const sessionsPath = path.join(__dirname, '../data/sessions.json');
if (!fs.existsSync(sessionsPath)) fs.writeFileSync(sessionsPath, JSON.stringify([]));

async function loginWithBrowserFallback(email, password, proxyObj) {
  try {
    if (!proxyObj) proxyObj = await getLockedProxy();
    const proxyUrl = proxyObj.formatted;

    const browser = await launch({
      headless: true,
      args: [`--proxy-server=${proxyUrl}`]
    });

    const page = await browser.newPage();
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'domcontentloaded' });

    // Add any stealth bypasses here as needed
    await page.setViewport({ width: 375, height: 812 });
    await page.waitForTimeout(2000); // Let the page settle

    // Log attempt
    console.log(`🧪 [Fallback] Simulating login for ${email} via browser`);

    // Simulate logic here (or optionally auto-login via UI selectors)

    // Save dummy session for testing purposes
    const session = {
      email,
      access_token: `fallback-${Date.now()}`,
      proxy: proxyUrl,
      timestamp: new Date().toISOString()
    };

    const all = JSON.parse(fs.readFileSync(sessionsPath));
    all.push(session);
    fs.writeFileSync(sessionsPath, JSON.stringify(all, null, 2));

    await browser.close();
    await releaseLockedProxy(proxyObj);

    return { success: true, session };
  } catch (err) {
    console.error(`❌ Browser fallback login failed: ${err.message}`);
    return { success: false };
  }
}

module.exports = { loginWithBrowserFallback };
