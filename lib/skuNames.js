const { fetchSnkrsUpcoming } = require('./dropFetchers'); // existing SNKRS scraper

let skuMap = {};

async function buildSkuMap() {
  try {
    const drops = await fetchSnkrsUpcoming();
    skuMap = {};
    for (const drop of drops) {
      if (drop.sku && drop.name) {
        skuMap[drop.sku.toUpperCase()] = drop.name;
      }
    }
  } catch (err) {
    console.error('⚠️ Failed to build SKU map:', err.message);
  }
}

function getProductNameFromSku(sku) {
  return skuMap[sku.toUpperCase()] || null;
}

module.exports = {
  buildSkuMap,
  getProductNameFromSku,
};
