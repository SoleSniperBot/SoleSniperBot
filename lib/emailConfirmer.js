const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

/**
 * Auto-visits a Nike confirmation link using Puppeteer
 * @param {string} url - The Nike confirmation URL from the email
 * @param {string} proxy - Optional SOCKS5 or HTTP proxy (e.g., http://user:pass@ip:port)
 * @returns {Promise<boolean>} - true if successful
 */
async function visitNikeConfirmationLink(url, proxy = null) {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled'
  ];

  if (proxy) args.push(`--proxy-server=${proxy.split('@')[1]}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args
  });

  const page = await browser.newPage();
