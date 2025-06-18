const fetch = require('node-fetch');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { getUKProxies } = require('./proxyScraper');

async function fetchSnkrsReleases() {
  const url = 'https://api.nike.com/product_feed/threads/v2?anchor=0&count=40&filter=marketplace(GB)&filter=language(en-GB)';
  const userAgent = 'Nike SNKRS Bot/1.0';
  const proxies = await getUKProxies(15);

  for (const proxy of proxies) {
    try {
      const agent = new SocksProxyAgent(proxy);
      const res = await fetch(url, {
        agent,
        headers: { 'User-Agent': userAgent }
      });

      if (!res.ok) continue;

      const data = await res.json();

      const drops = data.objects.filter(item =>
        item.product?.title && (
          item.publishedContent?.properties?.available ||
          item.publishedContent?.properties?.upcoming
        )
      );

      if (drops.length > 0) return drops.map(d => ({
        name: d.product.title,
        sku: d.product.styleColor,
        launchDate: d.product.launchView?.startEntryDate || 'Unknown',
      }));
    } catch (e) {
      continue; // Try next proxy
    }
  }

  return [];
}

module.exports = { fetchSnkrsReleases };
