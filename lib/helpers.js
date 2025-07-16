const crypto = require('crypto');

function generateRandomEmail() {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(2).toString('hex');
  return `sniper${timestamp}${randomSuffix}@botsolesniper.com`; // Modify domain if needed
}

function generateRandomName() {
  const firstNames = ['Mark', 'Tyrese', 'Jordan', 'Andre', 'Devon', 'Malik', 'Ethan', 'Jayden'];
  const lastNames = ['Phillips', 'Carter', 'Johnson', 'Brown', 'Evans', 'Taylor', 'Walker', 'King'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return { firstName, lastName };
}

module.exports = {
  generateRandomEmail,
  generateRandomName
};
