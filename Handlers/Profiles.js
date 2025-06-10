const fs = require('fs');
const path = require('path');

const profilesPath = path.join(__dirname, '../data/profiles.json');

function getProfiles() {
  try {
    const data = fs.readFileSync(profilesPath);
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function saveProfiles(profiles) {
  fs.writeFileSync(profilesPath, JSON.stringify(profiles, null, 2));
}

function getUserProfile(userId) {
  const profiles = getProfiles();
  return profiles[userId];
}

function saveUserProfile(userId, profile) {
  const profiles = getProfiles();
  profiles[userId] = profile;
  saveProfiles(profiles);
}

module.exports = {
  getUserProfile,
  saveUserProfile
};
