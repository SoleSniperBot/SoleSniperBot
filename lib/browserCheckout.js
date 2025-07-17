const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function browserCheckout(sku, proxy, profile) {
  console.log('🧪 Launching Puppeteer checkout...');

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

    // Proxy auth
    if (user && pass) {
      await page.authenticate({ username: user, password: pass });
    }

    // Step 1: Go to Nike login
    await page.goto('https://www.nike.com/gb/login', { waitUntil: 'networkidle2' });

    await page.waitForSelector('input[name="emailAddress"]', { timeout: 10000 });
    await page.type('input[name="emailAddress"]', profile.email, { delay: 80 });
    await page.type('input[name="password"]', profile.password, { delay: 80 });

    const loginButton = await page.$('input[value="SIGN IN"]') || await page.$('button[type="submit"]');
    if (loginButton) await loginButton.click();
    else throw new Error('Login button not found');

    await page.waitForTimeout(4000);

    // Step 2: Go to SNKRS product page
    const snkrsUrl = `https://www.nike.com/gb/t/${sku}`;
    console.log(`👟 Navigating to product page: ${snkrsUrl}`);
    await page.goto(snkrsUrl, { waitUntil: 'networkidle2' });

    // Step 3: Click Buy button
    const buyBtn = await page.$('button[data-qa="buy-button"]');
    if (buyBtn) {
      await buyBtn.click();
      console.log('🛒 Buy button clicked');
    } else {
      throw new Error('Buy button not found – product may be OOS or not loaded yet.');
    }

    // Step 4 (Optional): Size selection
    const sizeButton = await page.$('div[data-qa="size-selector"] button');
    if (sizeButton) {
      await sizeButton.click();
      console.log('📏 Size selected');
    }

    await page.waitForTimeout(2000);

    // Step 5 (Optional): Address autofill if needed
    if (profile.address) {
      // Example selectors – update as needed
      await page.type('#address1', profile.address);
      await page.type('#postalCode', profile.zip);
    }

    console.log(`✅ Checkout simulation done for ${profile.email} on SKU: ${sku}`);
    return {
      success: true,
      email: profile.email,
      sku,
    };

  } catch (err) {
    console.error(`❌ Checkout failed for ${profile.email} → ${err.message}`);
    return {
      success: false,
      error: err.message,
      email: profile.email,
      sku,
    };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = {
  browserCheckout,
};
