// lib/generator.js
module.exports = async function generateNikeAccount(proxy) {
  // Simulate async delay for account generation
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate a dummy Nike account with unique email and fixed password
  const timestamp = Date.now();
  const email = `user${timestamp}@example.com`;
  const password = 'Password123!';

  return { email, password };
};
