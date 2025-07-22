function generateRandomName() {
  const firstNames = ['Liam', 'Noah', 'Oliver', 'Elijah', 'James', 'Amelia', 'Emma', 'Ava', 'Sophia', 'Isabella'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller', 'Wilson'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return { firstName, lastName };
}

function generatePassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function getRandomNikeUserAgent() {
  const userAgents = [
    'Nike/105 (iPhone; iOS 15.6; Scale/3.00)',
    'Nike/104 (iPhone; iOS 16.2; Scale/3.00)',
    'Nike/106 (iPhone; iOS 17.0; Scale/3.00)',
    'Nike/102 (iPhone; iOS 14.8; Scale/2.00)'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function generateRandomDOB(minAge = 18, maxAge = 28) {
  const currentYear = new Date().getFullYear();
  const year = currentYear - Math.floor(Math.random() * (maxAge - minAge + 1) + minAge);
  const month = ('0' + Math.floor(Math.random() * 12 + 1)).slice(-2);
  const day = ('0' + Math.floor(Math.random() * 28 + 1)).slice(-2); // keep it safe
  return { day, month, year };
}

module.exports = {
  generateRandomName,
  generatePassword,
  getRandomNikeUserAgent,
  generateRandomDOB
};
