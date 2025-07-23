const fs = require('fs');
const path = require('path');

const sessionsPath = path.join(__dirname, '../data/sessions.json');

// Ensure file exists
if (!fs.existsSync(sessionsPath)) {
  fs.writeFileSync(sessionsPath, JSON.stringify({}, null, 2));
}

/**
 * Save cookies for a specific email
 * @param {string} email - Nike account email
 * @param {Array} cookies - Puppeteer cookies
 * @param {Object} metadata - Optional: firstName, lastName, proxy, timestamp, etc
 */
function saveSession(email, cookies, metadata = {}) {
  let sessions = {};

  try {
    sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
  } catch (e) {
    console.error('⚠️ Could not read sessions.json:', e.message);
  }

  sessions[email] = {
    cookies,
    ...metadata,
    lastSaved: new Date().toISOString()
  };

  fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
  console.log(`💾 Saved session for ${email}`);
}

/**
 * Load session cookies for a specific email
 * @param {string} email
 * @returns {object|null}
 */
function loadSession(email) {
  try {
    const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf-8'));
    return sessions[email] || null;
  } catch (e) {
    console.error('⚠️ Failed to load session for', email);
    return null;
  }
}

module.exports = {
  saveSession,
  loadSession
};
