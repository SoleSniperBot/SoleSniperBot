module.exports = async function generateNikeAccount(proxy) {
  // Simulated logic — you'd replace this with browser automation using Puppeteer or Axios with proxy
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  const email = `solesniper+${timestamp}@gmail.com`;
  const password = `TempPass!${randomNum}`;

  console.log(`👟 Generated account with proxy: ${proxy}`);

  return {
    email,
    password
  };
};
