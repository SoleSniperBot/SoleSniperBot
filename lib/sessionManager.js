const fs = require('fs');
const path = require('path');

const sessionsPath = path.join(__dirname, '../data/sessions.json');

if (!fs.existsSync(sessionsPath)) {
  fs.writeFileSync(sessionsPath, JSON.stringify({}));
}

function saveNikeSessionCookies(email, session) {
  const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
  sessions[email] = session;
  fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
  console.log(`🔐 Saved Nike session for ${email}`);
}

function loadNikeSessionCookies(email) {
  const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
  return sessions[email] || null;
}

module.exports = {
  saveNikeSessionCookies,
  loadNikeSessionCookies
};
