// /lib/dropFetchers.js
const fetch = require('node-fetch');

async function fetchSnkrsUpcoming() {
  const response = await fetch('https://api.nike.com/product_feed/threads/v2?anchor=0&count=10&filter=marketplace(GB)&filter=language(en-GB)&filter=upcoming(true)');
  const json = await response.json();
  return json.objects.map(obj => ({
    title: obj.product.title,
    sku: obj.product.styleColor,
    price: obj.product.price.fullRetailPrice,
    launchDate: obj.product.launchView.startEntryDate
  }));
}

module.exports = { fetchSnkrsUpcoming };
