function getRandomNikeUserAgent() {
  const agents = [
    'Nike/105 (iPhone; iOS 16.2; Scale/3.00)',
    'Nike/104 (iPhone; iOS 15.6; Scale/3.00)',
    'Nike/106 (iPhone; iOS 16.4; Scale/3.00)',
    'Nike/103 (iPhone; iOS 15.2; Scale/3.00)'
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

function generateRandomDOB() {
  const start = new Date(1985, 0, 1);
  const end = new Date(2003, 0, 1);
  const dob = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return {
    day: String(dob.getDate()).padStart(2, '0'),
    month: String(dob.getMonth() + 1).padStart(2, '0'),
    year: dob.getFullYear().toString()
  };
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

module.exports = {
  getRandomNikeUserAgent,
  generateRandomDOB,
  generatePassword
};
