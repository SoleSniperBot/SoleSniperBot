// lib/profiles.js
const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../data/profiles.json');

let profiles = {};
if (fs.existsSync(profilesPath)) {
  profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
}

function getUserProfile(userId) {
  return profiles[userId] || null;
}

function saveUserProfile(userId, profile) {
  profiles[userId] = profile;
  fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
}

module.exports = {
  getUserProfile,
  saveUserProfile,
};
