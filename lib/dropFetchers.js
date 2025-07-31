const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

// Load SOCKS5 proxies
const proxyPath = path.join(__dirname, '../data/socks5_proxies.json');
let proxies = [];
try {
  proxies = JSON.parse(fs.readFileSync(proxyPath));
} catch (e) {
  console.error('❌ Failed to load proxies:', e.message);
}

let lastUsed = 0;
function getNextProxy() {
  if (!proxies.length) return '';
  const proxy = proxies[lastUsed];
  lastUsed = (lastUsed + 1) % proxies.length;
  return proxy;
}

// Use TLS client to fetch SNKRS feed
async function fetchSnkrsUpcoming() {
  const tlsPath = path.join(__dirname, '../bin/tls-client');
  const proxyUrl = getNextProxy();

  const args = [
    '-u', 'https://api.nike.com/product_feed/threads/v2?anchor=0&count=20&filter=marketplace(GB)&filter=language(en-gb)&filter=channelId(snkrs)',
    '-X', 'GET',
    '-H', 'user-agent: Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
    '-H', 'x-nike-ux-id: com.nike.commerce.snkrs.ios',
    '-H', 'accept: application/json',
    '--timeout', '10000'
  ];

  if (proxyUrl) {
    args.push('--proxy', proxyUrl);
    console.log(`🌐 Using proxy: ${proxyUrl}`);
  }

  return new Promise((resolve, reject) => {
    execFile(tlsPath, args, (err, stdout, stderr) => {
      if (err) {
        console.error('❌ TLS-client error:', stderr || err.message);
        return reject(err);
      }

      try {
        const json = JSON.parse(stdout);
        const drops = json.body?.objects || [];
        console.log(`✅ SNKRS TLS fetched ${drops.length} products`);
        resolve(drops);
      } catch (e) {
        console.error('❌ TLS-client parse error:', e.message);
        reject(e);
      }
    });
  });
}

// Placeholder for lot fetcher (unchanged if you still use it)
async function fetchLotByModel(query) {
  return []; // implement if needed
}

module.exports = {
  fetchSnkrsUpcoming,
  fetchLotByModel
};
