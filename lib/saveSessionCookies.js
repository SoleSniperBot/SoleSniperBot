// lib/saveSessionCookies.js
const fs = require('fs');
const path = require('path');

const sessionDir = path.join(__dirname, '../data/sessions');
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

module.exports = async function saveNikeSessionCookies(email, page) {
  try {
    const cookies = await page.cookies();
    const sessionFile = path.join(sessionDir, `${email}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(cookies, null, 2));
    console.log(`🍪 Session saved for ${email}`);
  } catch (err) {
    console.error(`❌ Failed to save session for ${email}:`, err.message);
  }
};
