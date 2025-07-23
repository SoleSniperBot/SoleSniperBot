// lib/loginNike.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { fetchNike2FA } = require('./imap');
const { saveSession } = require('./sessionSaver');

puppeteer.use(StealthPlugin());

async function loginToNikeAndSaveSession(email, password, proxy) {
  console.log(`🔐 [NikeLogin] Logging in ${email} with proxy ${proxy}`);
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    `--proxy-server=${proxy}`
  ];

  const browser = await puppeteer.launch({
    headless: 'new',
    args,
    timeout: 60000
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148');

  try {
    await page.goto('https://www.nike.com/gb/launch', { waitUntil: 'networkidle2', timeout: 60000 });

    // Fallback selector logic
    const loginBtn = await page.$x("//a[contains(text(), 'Sign In') or contains(text(),'Join') or contains(@aria-label,'Sign')]");
    if (loginBtn.length) await loginBtn[0].click();
    else throw new Error('Login button not found');

    await page.waitForTimeout(5000);

    const emailSelectors = ['input[name="email"]', 'input[type="email"]', '//input[contains(@placeholder, "email")]', '//input[contains(@aria-label, "email")]'];

    let emailField;
    for (const selector of emailSelectors) {
      try {
        if (selector.startsWith('//')) {
          const elems = await page.$x(selector);
          if (elems.length) {
            emailField = elems[0];
            break;
          }
        } else {
          await page.waitForSelector(selector, { timeout: 10000 });
          emailField = await page.$(selector);
          break;
        }
      } catch (_) {}
    }

    if (!emailField) throw new Error('❌ Could not find email input');

    await emailField.type(email, { delay: 50 });

    const passwordField = await page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 15000 });
    await passwordField.type(password, { delay: 50 });

    const submitBtn = await page.$('input[type="submit"], button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    else throw new Error('Submit button not found');

    // 2FA Handling
    try {
      const code = await fetchNike2FA(email);
      console.log(`📬 [2FA] Code: ${code}`);

      const codeInput = await page.waitForSelector('input[name="code"], input[type="tel"]', { timeout: 20000 });
      await codeInput.type(code, { delay: 75 });

      const verifyBtn = await page.$('button[type="submit"]');
      if (verifyBtn) await verifyBtn.click();
    } catch (err) {
      console.warn('⚠️ [2FA] Failed to fetch or enter code:', err.message);
    }

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

    const cookies = await page.cookies();
    await saveSession(email, cookies);

    console.log(`✅ [NikeLogin] Session saved for ${email}`);
    await browser.close();
    return true;
  } catch (err) {
    console.error(`❌ [NikeLogin] Login failed for ${email}:`, err.message);

    // Detect if challenge page or CAPTCHA is triggered (placeholder for 2Captcha)
    const url = page.url();
    if (url.includes('challenge') || url.includes('captcha')) {
      console.warn('🧩 [NikeLogin] Detected CAPTCHA. Consider integrating 2Captcha here.');
      // If you have a 2Captcha key, solve it here via API.
    }

    await browser.close();
    return false;
  }
}

module.exports = loginToNikeAndSaveSession;
