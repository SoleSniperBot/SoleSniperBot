const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function loginNikeAccount(email, password, proxy) {
  const [ip, port, username, pass] = proxy.replace('http://', '').split(/[:@]/);
  const proxyUrl = `http://${username}:${pass}@${ip}:${port}`;

  console.log(`🔐 Logging into Nike for ${email} using proxy ${ip}:${port}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--proxy-server=${ip}:${port}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  try {
    const page = await browser.newPage();

    // Proxy authentication
    await page.authenticate({ username, password: pass });

    // Spoof user-agent (iPhone Safari)
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1 Nike/93'
    );

    await page.setViewport({ width: 375, height: 812, isMobile: true });

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    // Click login icon
    await page.waitForSelector('[data-qa="join-login-link"]', { timeout: 10000 });
    await page.click('[data-qa="join-login-link"]');
    await page.waitForTimeout(2000);

    // Wait for login form
    await page.waitForSelector('input[name="emailAddress"]', { timeout: 10000 });
    await page.type('input[name="emailAddress"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });

    // Submit login
    await page.click('input[type="submit"], button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });

    // Check if login was successful
    const loggedIn = await page.evaluate(() => {
      return document.body.innerText.includes('Member Access') || window.location.href.includes('/launch');
    });

    await browser.close();
    if (loggedIn) {
      console.log(`✅ Login success: ${email}`);
      return { success: true };
    } else {
      console.log(`⚠️ Login may have failed or needs 2FA: ${email}`);
      return { success: false, error: 'Login incomplete or blocked' };
    }
  } catch (err) {
    console.error(`❌ Login failed for ${email}: ${err.message}`);
    await browser.close();
    return { success: false, error: err.message };
  }
}

module.exports = { loginNikeAccount };
