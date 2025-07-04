const firstNames = ['Mark', 'Tina', 'Alex', 'Sophie', 'Ryan', 'Leah', 'Chris', 'Aisha', 'Daniel', 'Emily'];
const lastNames = ['Phillips', 'Brown', 'Smith', 'Johnson', 'Williams', 'Davis', 'Miller', 'Patel', 'Clark', 'Taylor'];

function generateRandomUser() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return {
    firstName: first,
    lastName: last,
    fullName: `${first} ${last}`
  };
}

module.exports = { generateRandomUser };
