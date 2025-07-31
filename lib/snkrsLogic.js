const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

module.exports = async function performCheckout(user, sku) {
  console.log(`🛒 [SNKRS] Attempting checkout for SKU ${sku}...`);

  try {
    const sessionsPath = path.join(__dirname, `../data/sessions`);
    const sessionFiles = fs.readdirSync(sessionsPath).filter(f => f.endsWith('.json'));

    if (sessionFiles.length === 0) throw new Error('No saved sessions found');

    const sessionFile = sessionFiles[0]; // Use first available session
    const cookies = JSON.parse(fs.readFileSync(path.join(sessionsPath, sessionFile)));

    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const page = await browser.newPage();
    await page.setCookie(...cookies);

    // Go to SNKRS SKU page
    const snkrsUrl = `https://www.nike.com/gb/launch/t/${sku}`;
    await page.goto(snkrsUrl, { waitUntil: 'networkidle2' });

    // Simulate button click and size select
    await page.waitForSelector('button[data-qa="add-to-cart"]', { timeout: 10000 });
    await page.click('button[data-qa="add-to-cart"]');
    await page.waitForTimeout(2000);

    // Go to cart
    await page.goto('https://www.nike.com/gb/cart', { waitUntil: 'networkidle2' });

    // Simulate checkout button
    const checkoutBtn = await page.$('button[data-automation="checkout-button"]');
    if (checkoutBtn) {
      await checkoutBtn.click();
      await page.waitForTimeout(3000);
      console.log('✅ [Checkout] Attempted SNKRS checkout');
    } else {
      throw new Error('Checkout button not found');
    }

    await browser.close();
    return { success: true, message: 'Checkout submitted' };
  } catch (err) {
    console.error('❌ [SNKRS Checkout Error]', err.message);
    return { success: false, message: err.message };
  }
};
