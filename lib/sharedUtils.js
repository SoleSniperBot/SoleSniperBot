const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const logWithTime = (msg) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${msg}`);
};

const generateRandomEmail = (firstName, lastName) => {
  const randomNum = Math.floor(Math.random() * 100000);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@gmail.com`;
};

const generateRandomName = () => {
  const firstNames = ['Mark', 'John', 'Liam', 'Noah', 'Lucas', 'Mason', 'Leo', 'James'];
  const lastNames = ['Phillips', 'Smith', 'Brown', 'Johnson', 'Davis', 'Walker', 'Evans'];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return { firstName, lastName };
};

module.exports = {
  delay,
  logWithTime,
  generateRandomEmail,
  generateRandomName
};
