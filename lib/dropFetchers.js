const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const fs = require('fs');
const path = require('path');

// Load proxy from file
const proxyList = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/socks5_proxies.json')));
let lastUsedIndex = 0;

function getNextProxy() {
  if (proxyList.length === 0) return null;
  const proxy = proxyList[lastUsedIndex];
  lastUsedIndex = (lastUsedIndex + 1) % proxyList.length;
  return proxy;
}

async function fetchSnkrsUpcoming() {
  const proxyUrl = getNextProxy();
  if (!proxyUrl) {
    console.error('❌ No proxies found for SNKRS fetch');
    return [];
  }

  console.log(`🌐 Using proxy: ${proxyUrl}`);

  const agent = new HttpsProxyAgent(proxyUrl);

  try {
    const response = await axios.get('https://api.nike.com/product_feed/threads/v2?anchor=0&count=20&filter=marketplace(GB)&filter=language(en-gb)&filter=channelId(snkrs)', {
      headers: {
        'user-agent': 'Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
        'accept': 'application/json',
        'x-nike-ux-id': 'com.nike.commerce.snkrs.ios',
        'x-newrelic-id': 'VQMGUlZVGwEAXVlbBAgBVw==',
        'x-nike-device-id': '00000000-0000-0000-0000-000000000000'
      },
      timeout: 10000,
      httpsAgent: agent
    });

    const products = response.data.objects || [];
    console.log(`✅ SNKRS fetch returned ${products.length} products`);
    return products;
  } catch (err) {
    console.error('❌ SNKRS scan error:', err.message);
    return [];
  }
}

module.exports = {
  fetchSnkrsUpcoming
};
