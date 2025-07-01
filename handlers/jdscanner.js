// handlers/jdscanner.js
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
        'accept': 'text/html',
      },
      validateStatus: () => true,
    });

    // Look for "Add to Basket" phrase on product page to infer stock
    return response.status === 200 && response.data.includes('Add to Basket');
  } catch (err) {
    console.error(`Error checking SKU ${sku}:`, err.message);
    return false;
  }
}

module.exports = (bot) => {
  setInterval(async () => {
    if (!fs.existsSync(skuPath)) return;

    let skus;
    try {
      skus = JSON.parse(fs.readFileSync(skuPath, 'utf-8'));
    } catch {
      console.error('Failed to parse jdskus.json');
      return;
    }
    if (!Array.isArray(skus) || skus.length === 0) return;

    for (const sku of skus) {
      const inStock = await checkJDStock(sku);
      if (inStock) {
        let vipData = {};
        try {
          vipData = JSON.parse(fs.readFileSync(vipPath, 'utf-8'));
        } catch {
          console.error('Failed to parse vip.json');
        }

        // VIP IDs might be an object with arrays inside; flatten both VIP and Elite users
        const vipIds = [
          ...(vipData.vip || []),
          ...(vipData.elite || [])
        ];

        for (const userId of vipIds) {
          try {
            await bot.telegram.sendMessage(
              userId,
              `🔥 JD SKU LIVE: ${sku}\nhttps://www.jdsports.co.uk/product/${sku}`
            );
          } catch (sendErr) {
            console.error(`Failed to send JD alert to ${userId}:`, sendErr.message);
          }
        }
      }
    }
  }, 60 * 1000); // every 60 seconds
};
