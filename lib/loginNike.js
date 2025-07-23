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
      '--disable-dev-shm-usage',
    ],
    defaultViewport: { width: 375, height: 812 }
  });

  const page = await browser.newPage();

  try {
    await page.authenticate({ username, password: proxyPass });
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    );

    console.log(`🌐 Navigating to login page...`);
    await page.goto('https://www.nike.com/gb/login', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    const emailSelector = 'input[name="email"]';
    const passwordSelector = 'input[name="password"]';
    const submitSelector = 'input[type="submit"]';

    let retries = 0;
    let loginSuccess = false;

    while (retries < 3 && !loginSuccess) {
      try {
        retries += 1;
        console.log(`⏳ [NikeLogin] Waiting for login fields... (Try ${retries})`);
        await page.waitForSelector(emailSelector, { timeout: 60000 }); // ⏱ now 60 seconds max

        await page.type(emailSelector, email, { delay: 40 });
        await page.type(passwordSelector, password, { delay: 40 });

        await Promise.all([
          page.click(submitSelector),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
        ]);

        const currentUrl = page.url();
        if (!currentUrl.includes('/login')) {
          console.log(`✅ [NikeLogin] Successfully logged in for ${email}`);
          loginSuccess = true;
        } else {
          console.warn(`⚠️ [NikeLogin] Still on login page, retrying...`);
        }
      } catch (err) {
        console.warn(`⚠️ [NikeLogin] Retry ${retries} failed: ${err.message}`);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000); // ✅ fixed await
      }
    }

    if (!loginSuccess) throw new Error('Login failed after retries');

    const cookies = await page.cookies();
    return { email, cookies };

  } catch (err) {
    console.error(`❌ [NikeLogin] Failed to login for ${email}:`, err.message);
  } finally {
    await browser.close();
  }
}

module.exports = loginToNikeAndSaveSession;
