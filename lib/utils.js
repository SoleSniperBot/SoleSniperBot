const faker = require('faker');

// Generate a random name
function generateRandomName() {
  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();
  return { firstName, lastName };
}

// Generate unique Nike-style email using a root inbox
function generateNikeEmail(root = 'solesniper') {
  const timestamp = Date.now();
  return `${root}+${timestamp}@gmail.com`;
}

// Generate secure password
function generatePassword() {
  return `TempPass!${Math.floor(1000 + Math.random() * 9000)}`;
}

module.exports = {
  generateRandomName,
  generateNikeEmail,
  generatePassword
};
