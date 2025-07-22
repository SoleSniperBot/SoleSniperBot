// lib/utils.js
function getRandomNikeUserAgent() {
  const versions = [97, 101, 105, 110, 113, 117];
  const iosVersions = ['15.6', '16.2', '16.6', '17.1', '17.3', '17.5'];
  const version = versions[Math.floor(Math.random() * versions.length)];
  const ios = iosVersions[Math.floor(Math.random() * iosVersions.length)];

  return `Nike/${version} (iPhone; iOS ${ios}; Scale/3.00)`;
}

module.exports = {
  generateRandomName,
  generateNikeEmail,
  generatePassword,
  getRandomNikeUserAgent // <-- ensure this is here!
};
