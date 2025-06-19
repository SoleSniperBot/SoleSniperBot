const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../data/profiles.json');

function getProfile(userId) {
  try {
    const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
    return profiles[userId] || null;
  } catch (err) {
    console.error('Error reading profiles:', err);
    return null;
  }
}

module.exports = { getProfile };
