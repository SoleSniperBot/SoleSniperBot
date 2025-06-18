const fetch = require('node-fetch');

async function fetchSnkrsReleases() {
  const url = 'https://api.nike.com/product_feed/threads/v2?anchor=0&count=40&filter=marketplace(GB)&filter=language(en-GB)';
  const headers = {
    'User-Agent': 'Nike SNKRS Bot/1.0',
  };

  try {
    const res = await fetch(url, { headers });
    const data = await res.json();

    const drops = data.objects.filter(item =>
      item.product?.title && (
        item.publishedContent?.properties?.available || item.publishedContent?.properties?.upcoming
      )
    );

    return drops.map(d => ({
      name: d.product.title,
      sku: d.product.styleColor,
      launchDate: d.product.launchView?.startEntryDate || 'Unknown',
    }));
  } catch (err) {
    console.error('❌ SNKRS Fetch Error:', err.message);
    return [];
  }
}

module.exports = { fetchSnkrsReleases };
