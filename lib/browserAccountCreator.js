require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUseragent = require('user-agents');
const { SocksProxyAgent } = require('socks-proxy-agent');
const ImapClient = require('./imapClient');
const { saveNikeSession } = require('./sessionManager');
const { generateRandomName, generateNikeEmail, generatePassword, generateDOB } = require('./utils');

puppeteer.use(StealthPlugin());

async function createNikeAccountWithBrowser(proxy) {
  const firstName = generateRandomName();
  const lastName = generateRandomName();
  const email = generateNikeEmail();
  const password = generatePassword();
  const dob = generateDOB();
  const userAgent = new randomUseragent().toString();

  const proxyUrl = `socks5://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      `--proxy-server=${proxyUrl}`,
    ]
  });

  const page = await browser.newPage();

  try {
    await page.setUserAgent(userAgent);
    await page.setViewport({ width: 375, height: 812 });

    if (proxy.username && proxy.password) {
      await page.authenticate({
        username: proxy.username,
        password: proxy.password
      });
    }

    await page.goto('https://www.nike.com/gb/launch', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // 🔐 Add your account creation flow here (form filling, submission, etc.)
    // Example placeholder for dev purposes:
    console.log(`✅ Ready to create: ${email} | ${password} | ${firstName} ${lastName} | ${dob}`);

    // 💌 Fetch and confirm email
    const confirmationLink = await ImapClient.fetchNikeConfirmationLink(email);
    if (confirmationLink) {
      await page.goto(confirmationLink, { waitUntil: 'networkidle2', timeout: 60000 });
      console.log('✅ Email confirmed via IMAP link');
    }

    // 💾 Save session
    await saveNikeSession(email, await page.cookies());

    await browser.close();

    return {
      email,
      password,
      firstName,
      lastName,
      dob,
      proxy: proxy.formatted
    };

  } catch (err) {
    console.error('❌ Browser account creation failed:', err.message);
    await browser.close();
    throw err;
  }
}

module.exports = { createNikeAccountWithBrowser };
