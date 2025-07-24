const fs = require('fs');
const path = require('path');

const sessionsPath = path.join(__dirname, '../data/sessions.json');

// Ensure file exists and is valid
if (!fs.existsSync(sessionsPath)) {
  fs.writeFileSync(sessionsPath, JSON.stringify({}));
}

// Read helper with fallback
function readSessions() {
  try {
    const data = fs.readFileSync(sessionsPath, 'utf-8');
    return JSON.parse(data || '{}');
  } catch (e) {
    console.error('❌ Failed to read session file:', e.message);
    return {};
  }
}

// Save session cookies
function saveNikeSessionCookies(email, session) {
  const sessions = readSessions();
  sessions[email] = session;
  fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
  console.log(`🔐 Saved Nike session for ${email}`);
}

// Load session cookies
function loadNikeSessionCookies(email) {
  const sessions = readSessions();
  return sessions[email] || null;
}

module.exports = {
  saveNikeSessionCookies,
  loadNikeSessionCookies
};
