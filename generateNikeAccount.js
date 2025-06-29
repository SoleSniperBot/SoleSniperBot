module.exports = async function generateNikeAccount(proxy) {
  // Simulated logic — replace with actual Nike account creation logic using proxy
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;

  console.log(`👟 Generated account with proxy: ${proxy}`);

  return {
    email,
    password,
    proxy  // return proxy for tracking/locking
  };
};
