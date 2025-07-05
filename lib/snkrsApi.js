const fetch = require('node-fetch');
const { SocksProxyAgent } = require('socks-proxy-agent');

const GEONODE_USER = process.env.GEONODE_USER;
const GEONODE_PASS = process.env.GEONODE_PASS;

function buildGeoNodeProxies(count = 10) {
  const proxies = [];
  for (let i = 0; i < count; i++) {
    const port = 9000 + Math.floor(Math.random() * 11); // Random 9000–9010
    proxies.push(`socks5://${GEONODE_USER}:${GEONODE_PASS}@proxy.geonode.io:${port}`);
  }
  return proxies;
}

async function fetchSnkrsReleases() {
  const url = 'https://api.nike.com/product_feed/threads/v2?anchor=0&count=40&filter=marketplace(GB)&filter=language(en-GB)';
  const userAgent = 'Nike SNKRS Bot/1.0';
  const proxies = buildGeoNodeProxies(10);

  for (const proxy of proxies) {
    try {
      console.log(`🌍 Trying SNKRS feed with GeoNode proxy: ${proxy}`);

      const agent = new SocksProxyAgent(proxy);

      const res = await fetch(url, {
        agent,
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (!res.ok) {
        console.warn(`❌ Proxy failed [${res.status}]: ${proxy}`);
        continue;
      }

      const data = await res.json();

      const drops = data.objects.filter(item =>
        item.product?.title && (
          item.publishedContent?.properties?.available ||
          item.publishedContent?.properties?.upcoming
        )
      );

      if (drops.length > 0) {
        console.log(`✅ Found ${drops.length} SNKRS drops`);
        return drops.map(d => ({
          name: d.product.title,
          sku: d.product.styleColor,
          launchDate: d.product.launchView?.startEntryDate || 'Unknown',
        }));
      } else {
        console.log(`⚠️ No drops found with this proxy`);
      }
    } catch (e) {
      console.warn(`⚠️ Error with proxy ${proxy}: ${e.message}`);
    }
  }

  return [];
}

module.exports = { fetchSnkrsReleases };
