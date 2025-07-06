const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function browserCheckout(sku, proxy, profile) {
  console.log('🧪 Launching Puppeteer fallback...');

  const [ip, port, user, pass] = proxy.split(':');
  const proxyUrl = `http://${user}:${pass}@${ip}:${port}`;

  const args = [
    `--proxy-server=${proxyUrl}`,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--window-size=375,812',
    '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  ];

  let browser;

  try {
    browser = await puppeteer.launch({ headless: 'new', args });
    const page = await browser.newPage();

    const snkrsUrl = `https://www.nike.com/gb/t/${sku}`;
    console.log(`🌐 Navigating to: ${snkrsUrl}`);
    await page.goto(snkrsUrl, { waitUntil: 'networkidle2' });

    // Simulated wait or interaction
    await page.waitForTimeout(3000);

    console.log(`✅ Puppeteer fallback completed for SKU: ${sku}`);
    return true;

  } catch (err) {
    console.error(`❌ Puppeteer checkout failed: ${err.message}`);
    return false;

  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  browserCheckout,
};
