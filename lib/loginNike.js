const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { fetchNikeCodeFromEmail } = require('./imap');
const { saveSessionCookies } = require('./sessionManager');

puppeteer.use(StealthPlugin());

async function loginToNikeAndSaveSession(email, password, proxy) {
  console.log(`👤 [NikeLogin] Logging in for ${email}`);

  const proxyString = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
  const userAgent = new randomUseragent().toString();

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      `--proxy-server=${proxy.host}:${proxy.port}`
    ]
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    // ✅ Proxy Auth
    await page.authenticate({
      username: proxy.username,
      password: proxy.password
    });

    await page.goto('https://www.nike.com/gb/login', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await page.waitForSelector('input[name="email"]', { timeout: 20000 });
    await page.type('input[name="email"]', email, { delay: 50 });
    await page.type('input[name="password"]', password, { delay: 50 });

    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 })
    ]);

    const url = page.url();

    // Handle 2FA
    if (url.includes('verify') || await page.$('input[name="otp"]')) {
      console.log(`📨 [NikeLogin] Waiting for 2FA code for ${email}`);
      const code = await fetchNikeCodeFromEmail(email);
      console.log(`🔐 [NikeLogin] Code received: ${code}`);
      await page.type('input[name="otp"]', code, { delay: 50 });
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 })
      ]);
    }

    const cookies = await page.cookies();
    await saveSessionCookies(email, cookies);
    console.log(`💾 [NikeLogin] Session saved for ${email}`);
  } catch (err) {
    console.error(`❌ [NikeLogin] Failed to login for ${email}:`, err.message);
  } finally {
    await browser.close();
  }
}

// ✅ Export as function directly (not wrapped in object)
module.exports = loginToNikeAndSaveSession;
