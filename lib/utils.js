const faker = require('faker');

// Generate a random name
function generateRandomName() {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  return { firstName, lastName };
}

// Generate unique Nike-style email using timestamp + random number
function generateNikeEmail(root = 'solesniper') {
  return `${root}+${Date.now() + Math.floor(Math.random() * 999)}@gmail.com`;
}

// Generate secure password
function generatePassword() {
  return `TempPass!${Math.floor(1000 + Math.random() * 9000)}`;
}

// Generate stealth SNKRS user-agent
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
  getRandomNikeUserAgent
};
