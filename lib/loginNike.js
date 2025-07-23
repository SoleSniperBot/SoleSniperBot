const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function loginToNikeAndSaveSession(email, password, proxyString) {
  console.log(`👤 [NikeLogin] Logging in for ${email}`);

  const proxyMatch = proxyString.match(/http:\/\/(?<username>[^:]+):(?<password>[^@]+)@(?<host>[^:]+):(?<port>\d+)/);
  if (!proxyMatch) {
    console.error('❌ [NikeLogin] Invalid proxy format');
    return;
  }

  const { username, password: proxyPass, host, port } = proxyMatch.groups;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      `--proxy-server=${host}:${port}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ],
    defaultViewport: { width: 375, height: 812 }
  });

  const page = await browser.newPage();

  try {
    await page.authenticate({ username, password: proxyPass });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');

    await page.goto('https://www.nike.com/gb/login', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    const emailSelector = 'input[name="email"]';
    const passwordSelector = 'input[name="password"]';
    const submitSelector = 'input[type="submit"]';

    // Retry-safe selector wait
    let formReady = false;
    for (let i = 0; i < 3; i++) {
      try {
        await page.waitForSelector(emailSelector, { timeout: 7000 });
        formReady = true;
        break;
      } catch {
        console.warn(`⏳ [NikeLogin] Retry ${i + 1}: waiting for login fields...`);
        await page.reload({ waitUntil: 'networkidle2' });
      }
    }

    if (!formReady) throw new Error('Login form not detected after retries');

    await page.type(emailSelector, email, { delay: 50 });
    await page.type(passwordSelector, password, { delay: 50 });

    await Promise.all([
      page.click(submitSelector),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
    ]);

    const cookies = await page.cookies();
    console.log(`✅ [NikeLogin] Logged in for ${email}, session cookies saved`);
    return { email, cookies };

  } catch (err) {
    console.error(`❌ [NikeLogin] Failed to login for ${email}:`, err.message);
  } finally {
    await browser.close();
  }
}

module.exports = loginToNikeAndSaveSession;
