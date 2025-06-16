const fetch = require('node-fetch');

// ✅ Fetch from Solebox API or similar sneaker listing API
async function fetchLotByModel(modelName) {
  const response = await fetch(`https://api.solebox.com/products/search?query=${encodeURIComponent(modelName)}`);
  if (!response.ok) throw new Error('❌ Solebox API request failed.');

  const json = await response.json();
  if (!json.results || json.results.length === 0) return [];

  return json.results.map(product => ({
    name: product.name || product.title || modelName,
    sku: product.sku || 'Unknown',
    releaseDate: product.release_date || 'TBD',
    link: product.url || ''
  }));
}

// ✅ Fetch upcoming drops from SNKRS (Nike)
async function fetchSnkrsUpcoming() {
  const response = await fetch('https://api.nike.com/launch/?filter=upcoming');
  if (!response.ok) throw new Error('❌ SNKRS API request failed.');

  const json = await response.json();
  if (!json.objects || !Array.isArray(json.objects)) return [];

  return json.objects.map(item => ({
    name: item.product.title || 'Unnamed',
    sku: item.product.style_color || 'Unknown',
    releaseDate: item.product.publish_date || 'TBD',
    link: item.url || ''
  }));
}

module.exports = {
  fetchLotByModel,
  fetchSnkrsUpcoming
};
