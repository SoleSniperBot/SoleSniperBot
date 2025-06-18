const fetch = require('node-fetch');

async function fetchSnkrsUpcoming() {
  const url = 'https://api.nike.com/product_feed/threads/v2?anchor=0&count=10&filter=marketplace%28GB%29&filter=language%28en-GB%29&filter=upcoming%28true%29&filter=exclusiveAccess%28false%29&filter=channelId%2816a64f41-412d-46fc-aacb-70a18904c66d%29';

  const res = await fetch(url);
  const data = await res.json();

  const drops = data.objects.map(obj => {
    const p = obj.publishedContent.properties;
    return {
      name: p.title,
      sku: obj.productInfo?.[0]?.merchProduct?.styleColor,
      releaseDate: p.launchView?.startEntryDate || 'TBA'
    };
  });

  return drops;
}

module.exports = {
  fetchSnkrsUpcoming
};
