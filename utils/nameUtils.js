const names = ['Mark', 'Lisa', 'John', 'Emily', 'Chris', 'Nina', 'Daniel', 'Sara'];
const surnames = ['Phillips', 'Johnson', 'Brown', 'Smith', 'Garcia', 'Morris'];

function getRandomName() {
  return {
    firstName: names[Math.floor(Math.random() * names.length)],
    lastName: surnames[Math.floor(Math.random() * surnames.length)]
  };
}

function generateGmailTrick(base) {
  const username = base.split('@')[0];
  const domain = base.split('@')[1];
  const rand = Math.floor(Math.random() * 100000);
  return `${username}+${rand}@${domain}`;
}

module.exports = { getRandomName, generateGmailTrick };
