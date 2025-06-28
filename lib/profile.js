// lib/profile.js
const fs = require('fs');
const path = require('path');

const profilePath = path.join(__dirname, '../data/profiles.json');

// Load user profiles from profiles.json
function getUserProfiles(userId) {
  if (!fs.existsSync(profilePath)) return [];

  const allProfiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  return allProfiles[userId] || [];
}

module.exports = {
  getUserProfiles
};
