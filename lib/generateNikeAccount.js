const { createNikeAccount } = require('../lib/nikeApi');
const { getRandomName, generateEmail, generatePassword } = require('../lib/utils');

module.exports = async function generateNikeAccount(user = 'system') {
  console.log(`👟 [NikeGen] Starting account creation for: ${user}`);

  try {
    const firstName = getRandomName();
    const lastName = getRandomName();
    const email = generateEmail(firstName, lastName);
    const password = generatePassword();

    const account = await createNikeAccount(email, password, firstName, lastName);

    console.log('✅ Nike account created:', account || email);
  } catch (err) {
    console.error('❌ Nike account generation failed:', err.message);
  }
};
