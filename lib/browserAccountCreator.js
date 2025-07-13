const createNikeAccountWithBrowser = async (email, password, proxy) => {
  const browser = await puppeteer.launch({ /* stealth config + proxy */ });
  const page = await browser.newPage();

  try {
    console.log(`🌐 [Browser] Would attempt manual signup for: ${email}`);

    // Emulate mobile browser, go to Nike signup page
    await page.goto('https://www.nike.com/register', { waitUntil: 'networkidle2' });

    // Fill form fields
    await page.type('input[name="emailAddress"]', email);
    await page.type('input[name="password"]', password);
    await page.type('input[name="firstName"]', 'Mark');
    await page.type('input[name="lastName"]', 'Phillips');
    await page.select('select[name="country"]', 'GB');
    await page.select('select[name="dateOfBirth.day"]', '10');
    await page.select('select[name="dateOfBirth.month"]', '1');
    await page.select('select[name="dateOfBirth.year"]', '2000');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    console.log(`✅ [Browser] Account created: ${email}`);

    // Error was due to this being undefined:
    // markEmailUsed(email); ← FIX: Define or remove this line

  } catch (err) {
    console.error(`❌ [Browser] Unexpected error: ${err.message}`);
  } finally {
    await browser.close();
  }
};
