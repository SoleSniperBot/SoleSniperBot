// generateNikeAccount.js

module.exports = async function generateNikeAccount() {
  // Basic placeholder (replace with your real logic)
  return {
    email: `user${Date.now()}@gmail.com`,
    password: `TempPass!${Math.floor(Math.random() * 10000)}`
  };
};
