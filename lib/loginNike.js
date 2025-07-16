const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function loginNikeAccount(email, password, proxy) {
  const [ip, port, username, pass] = proxy.replace('http://', '').split(/[:@]/);
  const formattedProxy = `http://${username}:${pass}@${ip}:${port}`;

  console.log(`🔐 Logging into Nike with proxy ${ip}:${port} for ${email}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [`--proxy-server=${ip}:${port}`],
  });

  try {
    const page = await browser.newPage();
    await page.authenticate({ username, password: pass });

    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);

    // Your login steps (fill form, submit, etc.) go here...
    console.log(`✅ Login process triggered for ${email}`);
    await browser.close();
    return { success: true };
  } catch (err) {
    console.error(`❌ Login failed for ${email}: ${err.message}`);
    await browser.close();
    return { success: false, error: err.message };
  }
}

module.exports = { loginNikeAccount };
