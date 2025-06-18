const fetch = require('node-fetch');

/**
 * Fetch detailed SNKRS product data (UK region)
 * @returns {Promise<Array>} Array of drop objects
 */
async function fetchSnkrsDropsDetailed() {
  try {
    const response = await fetch(
      'https://api.nike.com/product_feed/threads/v2?anchor=0&count=20&filter=marketplace(GB)&filter=language(en-GB)&filter=upcoming(true)'
    );

    const json = await response.json();

    const drops = json.objects.map(obj => {
      const p = obj.product;
      return {
        title: p.title,
        sku: p.styleColor,
        color: p.colorDescription,
        retailPrice: p.price.fullRetailPrice,
        image: p.imageUrl,
        status: p.publish.status,
        launchDate: p.launchView?.startEntryDate || 'TBA'
      };
    });

    return drops;
  } catch (err) {
    console.error('❌ SNKRS API failed:', err.message);
    return [];
  }
}

module.exports = { fetchSnkrsDropsDetailed };
