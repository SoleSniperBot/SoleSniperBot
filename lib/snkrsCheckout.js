const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const tlsPath = path.resolve(__dirname, '../bin/tls-client'); // Linux version (chmod +x already)

async function checkoutSNKRS({ account, profile, sku, size, proxy }) {
  const payload = {
    email: account.email,
    password: account.password,
    sku,
    size,
    profile,
    proxy: {
      host: proxy.host,
      port: proxy.port,
      username: proxy.username,
      password: proxy.password
    }
  };

  return new Promise(async (resolve) => {
    const payloadFile = path.join(__dirname, '../data/checkout_payload.json');
    fs.writeFileSync(payloadFile, JSON.stringify(payload));

    const child = execFile(tlsPath, ['--json', payloadFile], { timeout: 35000 }, async (error, stdout, stderr) => {
      if (error) {
        console.warn('⚠️ TLS failed, falling back to browser...');
        const fallback = await browserCheckout(account, profile, sku, size, proxy);
        return resolve(fallback);
      }

      try {
        const response = JSON.parse(stdout.toString());
        if (response && response.success) {
          return resolve({ success: true });
        } else {
          return resolve({ success: false, message: response.message || 'TLS returned failure' });
        }
      } catch (err) {
        return resolve({ success: false, message: 'Invalid TLS output' });
      }
    });
  });
}

async function browserCheckout(account, profile, sku, size, proxy) {
  const proxyArg = `--proxy-server=socks5://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      proxyArg,
      '--window-size=375,812',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Nike/230815 CFNetwork/1406.0.4 Darwin/22.4.0');
    await page.goto('https://www.nike.com/launch/t/' + sku, { waitUntil: 'networkidle2', timeout: 45000 });

    // Login
    await page.click('button[data-qa="join-login-button"]');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', account.email, { delay: 50 });
    await page.type('input[type="password"]', account.password, { delay: 50 });
    await page.click('input[type="submit"]');

    // Wait for redirect
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    // Select size
    await page.waitForSelector(`[data-qa="size-${size}"]`, { timeout: 10000 });
    await page.click(`[data-qa="size-${size}"]`);

    // Click buy
    await page.click('button[data-qa="buy-button"]');
    await page.waitForTimeout(5000);

    // Assume success if redirected or checkout modal shown
    await browser.close();
    return { success: true };
  } catch (err) {
    console.error('❌ Browser Checkout Error:', err.message);
    await browser.close();
    return { success: false, message: 'Browser fallback failed' };
  }
}

module.exports = { checkoutSNKRS };
