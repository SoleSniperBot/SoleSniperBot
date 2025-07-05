const fetch = require('node-fetch');
const { SocksProxyAgent } = require('socks-proxy-agent');

const GEONODE_USER = process.env.GEONODE_USER;
const GEONODE_PASS = process.env.GEONODE_PASS;

/**
 * Build array of GeoNode proxy URIs
 */
function buildProxyList(count = 10) {
  const proxies = [];
  for (let i = 0; i < count; i++) {
    const port = 9000 + Math.floor(Math.random() * 11); // Rotate 9000–9010
    proxies.push(`socks5://${GEONODE_USER}:${GEONODE_PASS}@proxy.geonode.io:${port}`);
  }
  return proxies;
}

/**
 * Fetch upcoming SNKRS drops (UK region)
 * Retries using up to 10 GeoNode proxies
 */
async function fetchSnkrsUpcoming() {
  const url = 'https://api.nike.com/product_feed/threads/v2?anchor=0&count=15&filter=marketplace(GB)&filter=language(en-GB)&filter=upcoming(true)';
  const proxies = buildProxyList(10);

  for (const proxyUri of proxies) {
    try {
      console.log(`🌍 Trying SNKRS API with proxy: ${proxyUri}`);

      const agent = new SocksProxyAgent(proxyUri);

      const response = await fetch(url, {
        agent,
        headers: {
          'User-Agent': 'Nike SNKRS Bot/1.0',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (!response.ok) {
        console.warn(`❌ Proxy blocked [${response.status}]: ${proxyUri}`);
        continue;
      }

      const json = await response.json();

      const drops = json.objects
        .filter(obj => obj.product?.title && obj.product?.styleColor)
        .map(obj => ({
          title: obj.product.title,
          sku: obj.product.styleColor,
          price: obj.product.price.fullRetailPrice,
          launchDate: obj.product.launchView?.startEntryDate || 'TBA'
        }));

      if (drops.length > 0) {
        console.log(`✅ Found ${drops.length} upcoming SNKRS drops.`);
        return drops;
      }

      console.log('⚠️ Proxy succeeded but no drops found.');
    } catch (err) {
      console.warn(`⚠️ Proxy failed: ${err.message}`);
    }
  }

  console.error('❌ All proxies failed or no drops found.');
  return [];
}

module.exports = { fetchSnkrsUpcoming };
