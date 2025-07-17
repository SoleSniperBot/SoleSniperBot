const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(email, password, proxyString) {
  const proxyHost = proxyString.split('@').pop().replace('http://', '');
  const proxyUrl = `--proxy-server=http://${proxyHost}`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        proxyUrl,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--window-size=375,812',
        '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      ],
      executablePath: process.env.CHROME_BINARY || undefined // use default or Railway's
    });

    const page = await browser.newPage();
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2' });

    // 👇 Your signup logic here

    await browser.close();
    return true;
  } catch (e) {
    console.error('❌ Puppeteer error:', e.message);
    return false;
  }
}
