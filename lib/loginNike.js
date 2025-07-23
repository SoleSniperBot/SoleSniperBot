// /app/lib/loginNike.js
require('dotenv').config();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Optional IMAP 2FA helper (safe import; tolerate absence)
let fetchNike2FA = async () => null;
try {
  ({ fetchNike2FA } = require('./imapFetcher'));
} catch {
  // leave as no-op if IMAP support not wired yet
}

puppeteer.use(StealthPlugin());

/**
 * Parse proxy string of form:
 *   http://username:password@host:port
 * Returns { username, password, host, port, serverArg }
 */
function parseProxy(proxyString) {
  if (!proxyString) return null;
  const m = proxyString.match(/^https?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)$/i);
  if (!m) return null;
  return {
    username: m[1],
    password: m[2],
    host: m[3],
    port: m[4],
    serverArg: `${m[3]}:${m[4]}`, // what Chromium expects
  };
}

/**
 * Login to Nike and save session cookies.
 * If proxyString supplied we use *that*, otherwise no proxy.
 * Returns true on success, false on failure.
 */
async function loginNikeAccount(email, password, proxyString = null) {
  const parsed = parseProxy(proxyString);
  if (proxyString && !parsed) {
    console.error(`[NikeLogin] Bad proxy string: ${proxyString}`);
    return false;
  }

  const cookiesDir = path.join(__dirname, '../data/cookies');
  if (!fs.existsSync(cookiesDir)) fs.mkdirSync(cookiesDir, { recursive: true });
  const cookiesPath = path.join(cookiesDir, `${email}.json`);

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
  ];
  if (parsed) {
    args.push(`--proxy-server=${parsed.serverArg}`);
    console.log(`🌐 [NikeLogin] Using proxy ${parsed.serverArg} for ${email}`);
  } else {
    console.log(`🌐 [NikeLogin] No proxy supplied; logging in direct for ${email}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args,
    defaultViewport: { width: 390, height: 844 },
  });

  const page = await browser.newPage();

  // If auth proxy, supply creds
  if (parsed) {
    await page.authenticate({
      username: parsed.username,
      password: parsed.password,
    });
  }

  // Mobile UA (can swap for iPhone16 later)
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  );

  try {
    // 1. Go to Launch (less bot-guarded than /login direct)
    await page.goto('https://www.nike.com/gb/launch', {
      timeout: 90000,
      waitUntil: 'domcontentloaded',
    });

    // 2. Click JOIN / SIGN IN
    const loginBtnSelectors = [
      'button[data-qa="join-login-link"]',
      'button[aria-label*="sign in" i]',
      'button[aria-label*="join" i]',
      'a[href*="login"]',
      'a[href*="join"]',
    ];

    let clicked = false;
    for (const sel of loginBtnSelectors) {
      const el = await page.$(sel);
      if (el) {
        await el.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      // maybe login modal loads in a side drawer via JS event
      console.warn('⚠️ [NikeLogin] Login button not found; trying fallback navigation.');
      await page.goto('https://www.nike.com/gb/login', {
        timeout: 90000,
        waitUntil: 'domcontentloaded',
      });
    } else {
      // Wait a beat for modal render
      await page.waitForTimeout(1500);
    }

    // 3. Wait for login fields (multiple variants)
    const emailSelectors = ['input[name="emailAddress"]', 'input[name="email"]', '#username', '#email'];
    const passSelectors = ['input[name="password"]', '#password', 'input[type="password"]'];

    const waitForOne = async (sels, timeout) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        for (const sel of sels) {
          if (await page.$(sel)) return sel;
        }
        await page.waitForTimeout(250);
      }
      throw new Error('fields not found');
    };

    const emailSel = await waitForOne(emailSelectors, 30000);
    const passSel = await waitForOne(passSelectors, 30000);

    await page.type(emailSel, email, { delay: 40 });
    await page.type(passSel, password, { delay: 40 });

    // Some Nike flows need an explicit submit button
    const submitSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      'button[data-qa="login-submit"]',
      'button[name="verify"]',
    ];
    let submitted = false;
    for (const sel of submitSelectors) {
      const el = await page.$(sel);
      if (el) {
        await Promise.allSettled([
          el.click(),
          page.waitForNavigation({ timeout: 60000, waitUntil: 'domcontentloaded' }).catch(() => {}),
        ]);
        submitted = true;
        break;
      }
    }
    if (!submitted) {
      // fallback Enter key
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);
    }

    // 4. Detect OTP/2FA — only if necessary
    let otpSel = null;
    const otpSelectors = ['input[name="code"]', 'input[name="otp"]', 'input[name="passcode"]'];
    for (const sel of otpSelectors) {
      if (await page.$(sel)) {
        otpSel = sel;
        break;
      }
    }

    if (otpSel) {
      console.log(`📨 [NikeLogin] 2FA required for ${email}. Fetching code...`);
      const code = await fetchNike2FA(email).catch(() => null);
      if (!code) {
        throw new Error('2FA required but no code retrieved');
      }
      await page.type(otpSel, code, { delay: 60 });
      // submit OTP
      const otpBtn = await page.$('button[type="submit"], input[type="submit"]');
      if (otpBtn) {
        await Promise.allSettled([
          otpBtn.click(),
          page.waitForNavigation({ timeout: 60000, waitUntil: 'domcontentloaded' }).catch(() => {}),
        ]);
      } else {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1500);
      }
    }

    // 5. Verify login success
    // Nike usually sets a cookie + shows user menu avatar
    let loggedIn = false;
    const successSelectors = [
      '[data-qa="user-button"]',
      'a[href*="/member/profile"]',
      'a[href*="/account"]',
      'img[alt*="profile" i]',
    ];
    for (let i = 0; i < 40; i++) {
      for (const sel of successSelectors) {
        if (await page.$(sel)) {
          loggedIn = true;
          break;
        }
      }
      if (loggedIn) break;
      await page.waitForTimeout(500);
    }

    if (!loggedIn) {
      // last chance: look at URL
      const url = page.url();
      if (/member|account|profile/i.test(url)) loggedIn = true;
    }

    if (!loggedIn) {
      throw new Error('Login not confirmed (no profile UI detected).');
    }

    // 6. Save cookies
    const cookies = await page.cookies();
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    console.log(`✅ [NikeLogin] Success & cookies saved for ${email}`);

    await browser.close();
    return true;
  } catch (err) {
    console.error(`❌ [NikeLogin] Failed for ${email}: ${err.message}`);
    await browser.close();
    return false;
  }
}

module.exports = loginNikeAccount;
