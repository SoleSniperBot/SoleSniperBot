const fs = require('fs');
const path = require('path');

function checkSession(email) {
  const cookiePath = path.join(__dirname, `../data/cookies/${email}.json`);
  if (!fs.existsSync(cookiePath)) return '❌ No session';
  try {
    const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
    const hasNikeCookie = cookies.some(c => c.name.includes('Nike') || c.domain.includes('nike.com'));
    return hasNikeCookie ? '✅ Logged In' : '🛑 Invalid';
  } catch {
    return '⚠️ Corrupt Cookie';
  }
}

module.exports = { checkSession };
