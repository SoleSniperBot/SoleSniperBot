const { execFile } = require('child_process');
const path = require('path');

function fetchSnkrsViaTLS(proxyUrl = '') {
  return new Promise((resolve, reject) => {
    const tlsPath = path.join(__dirname, '../bin/tls-client');

    const args = [
      '-u', 'https://api.nike.com/product_feed/threads/v2?anchor=0&count=20&filter=marketplace(GB)&filter=language(en-gb)&filter=channelId(snkrs)',
      '-X', 'GET',
      '-H', 'user-agent: Nike/93 (iPhone; iOS 15.6; Scale/3.00)',
      '-H', 'x-nike-ux-id: com.nike.commerce.snkrs.ios',
      '-H', 'accept: application/json',
      '--timeout', '10000'
    ];

    if (proxyUrl) {
      args.push('--proxy', proxyUrl); // e.g. socks5://user:pass@ip:port
    }

    execFile(tlsPath, args, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ TLS-client error:', stderr || error.message);
        return reject(error);
      }

      try {
        const json = JSON.parse(stdout);
        const products = json.body?.objects || [];
        console.log(`✅ SNKRS TLS-client fetched ${products.length} products`);
        resolve(products);
      } catch (e) {
        console.error('❌ TLS-client parse error:', e.message);
        reject(e);
      }
    });
  });
}

module.exports = { fetchSnkrsViaTLS };
