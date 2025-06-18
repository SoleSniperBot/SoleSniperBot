const fetch = require('node-fetch');

/**
 * Fetch upcoming SNKRS drops (UK region)
 * @returns {Promise<Array>} List of upcoming products
 */
async function fetchSnkrsUpcoming() {
  try {
    const response = await fetch(
      'https://api.nike.com/product_feed/threads/v2?anchor=0&count=15&filter=marketplace(GB)&filter=language(en-GB)&filter=upcoming(true)'
    );

    const json = await response.json();

    const upcoming = json.objects.map(obj => {
      const product = obj.product;
      return {
        title: product.title,
        sku: product.styleColor,
        price: product.price.fullRetailPrice,
        launchDate: obj.product.launchView?.startEntryDate || 'TBA',
      };
    });

    return upcoming;
  } catch (err) {
    console.error('❌ Failed to fetch SNKRS drops:', err.message);
    return [];
  }
}

module.exports = { fetchSnkrsUpcoming };
