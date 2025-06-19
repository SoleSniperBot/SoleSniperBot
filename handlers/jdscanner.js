const fs = require('fs');
const path = require('path');
const axios = require('axios');

const skuPath = path.join(__dirname, '../data/jdskus.json');
const vipPath = path.join(__dirname, '../data/vip.json');

async function checkJDStock(sku) {
  try {
    const url = `https://www.jdsports.co.uk/product/${sku}`;
    const response = await axios.get(url, {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'accept': 'text/html'
      },
      validateStatus: () => true
    });

    return response.status === 200 && response.data.includes('Add to Basket');
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
        const vipData = JSON.parse(fs.readFileSync(vipPath));
        const vipIds = Object.keys(vipData);

        for (const userId of vipIds) {
          bot.telegram.sendMessage(
            userId,
            `JD SKU LIVE: ${sku}\nhttps://www.jdsports.co.uk/product/${sku}`
          );
        }
      }
    }
  }, 60000);
};
