const fs = require('fs');
const path = require('path');
const axios = require('axios');

const skuPath = path.join(__dirname, '../data/jdskus.json');

async function checkJDStock(sku) {
  try {
    const url = `https://www.jdsports.co.uk/product/${sku}`;
    const response = await axios.get(url, {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'accept': 'text/html'
      },
      validateStatus: () => true // Prevent throw on 403/404
    });

    if (response.status === 200 && response.data.includes('Add to Basket')) {
      return true; // Product is live & cartable
    }

    return false;
  } catch (err) {
    console.error(`Error checking SKU ${sku}:`, err.message);
    return false;
  }
}

module.exports = (bot) => {
  setInterval(async () => {
    if (!fs.existsSync(skuPath)) return;

    const skus = JSON.parse(fs.readFileSync(skuPath));
    if (!Array.isArray(skus) || skus.length === 0) return;

    for (const sku of skus) {
      const inStock = await checkJDStock(sku);
      if (inStock) {
        const url = `https://www.jdsports.co.uk/product/${sku}`;
        bot.telegram.sendMessage(
          process.env.ADMIN_ID, // change to broadcast later
          `🔔 JD SKU LIVE: ${sku}\n${url}`
        );
      }
    }
  }, 60000); // check every 60 seconds
};
