const faker = require('faker');

function generateRandomName() {
  return {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName()
  };
}

function generateNikeEmail(index = '') {
  const timestamp = Date.now();
  return `solesniper+${timestamp}${index}@gmail.com`;
}

function generatePassword() {
  const base = faker.internet.password(8);
  return `${base}Aa1!`; // Meets Nike complexity rules
}

function generateRandomDOB() {
  const year = Math.floor(Math.random() * (2003 - 1985 + 1)) + 1985;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return { day, month, year };
}

module.exports = {
  generateRandomName,
  generateNikeEmail,
  generatePassword,
  generateRandomDOB
};
