// Fix: More resilient wait for email input
const emailSelector = 'input[name="email"]';
let emailFound = false;

for (let i = 0; i < 3; i++) {
  try {
    console.log(`🕵🏾 [NikeLogin] Attempt ${i + 1}: Checking for login form...`);

    await page.waitForSelector(emailSelector, { timeout: 20000, visible: true });

    const inputVisible = await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      return el && window.getComputedStyle(el).display !== 'none';
    }, emailSelector);

    if (inputVisible) {
      emailFound = true;
      break;
    } else {
      console.warn(`⚠️ [NikeLogin] Email field not visible, reloading...`);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

  } catch (err) {
    console.warn(`⚠️ [NikeLogin] Retry ${i + 1} failed: ${err.message}`);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
  }
}

if (!emailFound) {
  throw new Error(`Email input field not found after retries`);
}
