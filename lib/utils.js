const faker = require('faker');

function generateRandomName() {
  return {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName()
  };
}

function generatePassword() {
  return faker.internet.password(12) + '1!';
}

function generateNikeEmail() {
  const timestamp = Date.now();
  const rand = Math.floor(Math.random() * 10000);
  return `solesniper+${timestamp}${rand}@gmail.com`;
}

function getRandomNikeUserAgent() {
  return 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)';
}

function generateRandomDOB() {
  const year = Math.floor(Math.random() * (2003 - 1987 + 1)) + 1987;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return { day, month, year };
}

module.exports = {
  generateRandomName,
  generatePassword,
  generateNikeEmail,
  getRandomNikeUserAgent,
  generateRandomDOB
};
