const fs = require('fs');
const path = require('path');

function loadSessionCookies(email) {
  const cookiePath = path.join(__dirname, `../data/cookies/${email}.json`);
  if (!fs.existsSync(cookiePath)) {
    throw new Error(`No saved cookies found for ${email}`);
  }

  const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
  return cookies;
}

module.exports = { loadSessionCookies };
